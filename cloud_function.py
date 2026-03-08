import os
import json
import urllib.request
from datetime import datetime, timedelta, timezone
import functions_framework

# Set your Discord webhook URL and Firebase Project ID as environment variables in GCP
DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL")
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID")

def get_ist_today():
    # IST is UTC+5:30
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    return datetime.now(ist_tz).date()

def add_days_to_date_str(date_str, add_days):
    dt = datetime.strptime(date_str, "%Y-%m-%d").date()
    return dt + timedelta(days=add_days)

def extract_value(field_data):
    if not field_data: return None
    if 'stringValue' in field_data: return field_data['stringValue']
    if 'integerValue' in field_data: return int(field_data['integerValue'])
    if 'booleanValue' in field_data: return field_data['booleanValue']
    if 'arrayValue' in field_data:
        values = field_data['arrayValue'].get('values', [])
        return [extract_value(v) for v in values]
    if 'mapValue' in field_data:
        fields = field_data['mapValue'].get('fields', {})
        return {k: extract_value(v) for k, v in fields.items()}
    return None

def parse_doc(doc):
    fields = doc.get('fields', {})
    doc_id = doc.get('name', '').split('/')[-1]
    parsed = {'id': doc_id}
    for k, v in fields.items():
        parsed[k] = extract_value(v)
    return parsed

def fetch_collection(collection_name):
    docs = []
    page_token = None
    if not FIREBASE_PROJECT_ID:
        print("FIREBASE_PROJECT_ID not set!")
        return []
        
    base_url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/{collection_name}"
    
    while True:
        url = base_url
        if page_token:
            url += f"?pageToken={page_token}"
        else:
            url += "?pageSize=300"
            
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                docs.extend(data.get('documents', []))
                page_token = data.get('nextPageToken')
                if not page_token:
                    break
        except Exception as e:
            print(f"Error fetching {collection_name}: {e}")
            break
            
    return [parse_doc(d) for d in docs]

def fetch_query(collection_name, field, value):
    docs = []
    if not FIREBASE_PROJECT_ID:
        print("FIREBASE_PROJECT_ID not set!")
        return []

    base_url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery"
    
    query = {
        "structuredQuery": {
            "from": [{"collectionId": collection_name}],
            "where": {
                "fieldFilter": {
                    "field": {"fieldPath": field},
                    "op": "EQUAL",
                    "value": {"booleanValue": value}
                }
            }
        }
    }
    
    try:
        req = urllib.request.Request(base_url, method="POST")
        req.add_header('Content-Type', 'application/json')
        data = json.dumps(query).encode('utf-8')
        with urllib.request.urlopen(req, data=data) as response:
            results = json.loads(response.read().decode())
            for res in results:
                if 'document' in res:
                    docs.append(res['document'])
    except Exception as e:
        print(f"Error querying {collection_name}: {e}")
            
    return [parse_doc(d) for d in docs]

@functions_framework.http
def send_daily_reminder(request):
    """HTTP Cloud Function."""
    today = get_ist_today()
    today_str_display = today.strftime("%d-%m-%Y")

    due_today = []
    overdue = []

    # 1. Fetch Intervals
    intervals = {}
    intervals_docs = fetch_collection('intervals')
    for data in intervals_docs:
        intervals[data['id']] = data.get('days', [])

    # 2. Fetch Topics (Only unarchived ones)
    topics_docs = fetch_query('topics', 'archived', False)
    for topic in topics_docs:
            
        topic_name = topic.get('name', 'Unknown Task')
        completed_dates = topic.get('completedDates', [])

        if topic.get('type') == 'spaced':
            interval_id = topic.get('intervalId')
            start_date_str = topic.get('startDate')
            
            if interval_id in intervals and start_date_str:
                days_offsets = intervals[interval_id]
                for idx, day_offset in enumerate(days_offsets):
                    try:
                        due_date = add_days_to_date_str(start_date_str, day_offset)
                        due_date_str = due_date.strftime("%Y-%m-%d")
                        
                        if due_date_str not in completed_dates:
                            if due_date < today:
                                overdue.append(f"🔴 [Overdue] {topic_name} (Rev {idx+1}) - {due_date.strftime('%d-%m-%Y')}")
                            elif due_date == today:
                                due_today.append(f"🟢 [Today] {topic_name} (Rev {idx+1})")
                    except ValueError:
                        continue
        
        elif topic.get('type') == 'reminder':
            reminder_date_str = topic.get('reminderDate')
            if reminder_date_str and reminder_date_str not in completed_dates:
                try:
                    due_date = datetime.strptime(reminder_date_str, "%Y-%m-%d").date()
                    if due_date < today:
                        overdue.append(f"🔴 [Overdue] {topic_name} (Reminder) - {due_date.strftime('%d-%m-%Y')}")
                    elif due_date == today:
                        due_today.append(f"🟢 [Today] {topic_name} (Reminder)")
                except ValueError:
                    continue

    # 3. Fetch CA Subjects
    ca_subjects_docs = fetch_collection('ca_subjects')
    for subj in ca_subjects_docs:
        subj_name = subj.get('name', 'Unknown Subject')
        
        # CA Revisions
        revisions = subj.get('revisions', [])
        for idx, rev in enumerate(revisions):
            if not rev.get('completed'):
                start_date_str = rev.get('startDate')
                target_days = rev.get('targetDays', 0)
                if start_date_str:
                    try:
                        due_date = add_days_to_date_str(start_date_str, target_days)
                        due_date_str = due_date.strftime("%Y-%m-%d")
                        
                        if due_date < today:
                            overdue.append(f"🔴 [Overdue CA Rev] {subj_name} (Rev {idx+1}) - {due_date.strftime('%d-%m-%Y')}")
                        elif due_date == today:
                            due_today.append(f"🟢 [Today CA Rev] {subj_name} (Rev {idx+1})")
                    except ValueError:
                        continue
        
        # CA Reminders
        reminders = subj.get('reminders', [])
        for rem in reminders:
            if not rem.get('completed'):
                due_date_str = rem.get('dueDate')
                text = rem.get('text', 'Reminder')
                if due_date_str:
                    try:
                        due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
                        if due_date < today:
                            overdue.append(f"🔴 [Overdue CA Rem] {subj_name}: {text} - {due_date.strftime('%d-%m-%Y')}")
                        elif due_date == today:
                            due_today.append(f"🟢 [Today CA Rem] {subj_name}: {text}")
                    except ValueError:
                        continue

    # Prepare message body
    if not due_today and not overdue:
        body = "You have no tasks due today and no overdue tasks. Great job!"
    else:
        body = ""
        if overdue:
            body += "**🚨 OVERDUE TASKS**\n" + "\n".join(overdue) + "\n\n"
        if due_today:
            body += "**📅 DUE TODAY**\n" + "\n".join(due_today)

    # Make sure body is not too long for Discord (Discord limit is 4096 for description)
    if len(body) > 4000:
        body = body[:4000] + "...\n\n*(Truncated due to Discord length limits)*"

    embed = {
        "title": f"🗓️ Daily Dashboard ({today_str_display})",
        "description": body,
        "color": 15548997 if overdue else 5763719,
        "footer": {
            "text": "Compass Daily Tracker"
        }
    }

    if DISCORD_WEBHOOK_URL:
        req = urllib.request.Request(DISCORD_WEBHOOK_URL, method="POST")
        req.add_header('Content-Type', 'application/json')
        req.add_header('User-Agent', 'CloudFunction/1.0')
        data = json.dumps({"embeds": [embed]}).encode('utf-8')
        
        try:
            urllib.request.urlopen(req, data=data)
            return ("Successfully sent reminder", 200)
        except Exception as e:
            print(f"Failed to send to Discord: {e}")
            return (f"Error: {e}", 500)
    else:
        print("DISCORD_WEBHOOK_URL not set! Would have sent:")
        print(json.dumps(embed, indent=2))
        return (json.dumps(embed), 200)
