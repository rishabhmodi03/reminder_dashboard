import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta

FIREBASE_PROJECT_ID = "day-compass-swfz1"
DAYS_TO_ADD = 2

def add_days_to_date_str(date_str, add_days):
    if not date_str:
        return date_str
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d").date()
        new_dt = dt + timedelta(days=add_days)
        return new_dt.strftime("%Y-%m-%d")
    except ValueError:
        return date_str

def fetch_collection(collection_name):
    docs = []
    page_token = None
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
            
    return docs

def patch_document(doc_name, data, update_mask_paths):
    url = f"https://firestore.googleapis.com/v1/{doc_name}"
    if update_mask_paths:
        query_parts = [f"updateMask.fieldPaths={path}" for path in update_mask_paths]
        url += "?" + "&".join(query_parts)
        
    try:
        req = urllib.request.Request(url, method="PATCH")
        req.add_header('Content-Type', 'application/json')
        payload = json.dumps(data).encode('utf-8')
        with urllib.request.urlopen(req, data=payload) as response:
            res = json.loads(response.read().decode())
            return True
    except urllib.error.HTTPError as e:
        print(f"HTTPError updating {doc_name}: {e.code} - {e.read().decode()}")
        return False
    except Exception as e:
        print(f"Error updating {doc_name}: {e}")
        return False

def process_topics():
    docs = fetch_collection('topics')
    print(f"Fetched {len(docs)} topics.")
    updated_count = 0
    for doc in docs:
        fields = doc.get("fields", {})
        doc_name = doc.get("name")
        
        needs_update = False
        new_fields = {}
        update_mask = []
        
        # Check startDate
        if "startDate" in fields and "stringValue" in fields["startDate"]:
            old_date = fields["startDate"]["stringValue"]
            new_date = add_days_to_date_str(old_date, DAYS_TO_ADD)
            if new_date != old_date:
                new_fields["startDate"] = {"stringValue": new_date}
                update_mask.append("startDate")
                needs_update = True
            
        # Check reminderDate
        if "reminderDate" in fields and "stringValue" in fields["reminderDate"]:
            old_date = fields["reminderDate"]["stringValue"]
            new_date = add_days_to_date_str(old_date, DAYS_TO_ADD)
            if new_date != old_date:
                new_fields["reminderDate"] = {"stringValue": new_date}
                update_mask.append("reminderDate")
                needs_update = True
            
        # Check completedDates
        if "completedDates" in fields and "arrayValue" in fields["completedDates"]:
            values = fields["completedDates"]["arrayValue"].get("values", [])
            new_values = []
            changed = False
            for val in values:
                if "stringValue" in val:
                    old_cd = val["stringValue"]
                    new_cd = add_days_to_date_str(old_cd, DAYS_TO_ADD)
                    new_values.append({"stringValue": new_cd})
                    if new_cd != old_cd:
                        changed = True
                else:
                    new_values.append(val)
            if changed:
                new_fields["completedDates"] = {"arrayValue": {"values": new_values}}
                update_mask.append("completedDates")
                needs_update = True
                
        if needs_update:
            patch_data = {"fields": new_fields}
            if patch_document(doc_name, patch_data, update_mask):
                updated_count += 1
                
    print(f"Updated {updated_count} topics.")

def process_ca_subjects():
    docs = fetch_collection('ca_subjects')
    print(f"Fetched {len(docs)} ca_subjects.")
    updated_count = 0
    for doc in docs:
        fields = doc.get("fields", {})
        doc_name = doc.get("name")
        
        needs_update = False
        new_fields = {}
        update_mask = []
        
        # Check revisions
        if "revisions" in fields and "arrayValue" in fields["revisions"]:
            revs = fields["revisions"]["arrayValue"].get("values", [])
            new_revs = []
            changed = False
            for rev in revs:
                if "mapValue" in rev and "fields" in rev["mapValue"]:
                    r_fields = rev["mapValue"]["fields"]
                    if "startDate" in r_fields and "stringValue" in r_fields["startDate"]:
                        old_date = r_fields["startDate"]["stringValue"]
                        new_date = add_days_to_date_str(old_date, DAYS_TO_ADD)
                        if new_date != old_date:
                            r_fields["startDate"]["stringValue"] = new_date
                            changed = True
                new_revs.append(rev)
                
            if changed:
                new_fields["revisions"] = {"arrayValue": {"values": new_revs}}
                update_mask.append("revisions")
                needs_update = True
                
        # Check reminders
        if "reminders" in fields and "arrayValue" in fields["reminders"]:
            rems = fields["reminders"]["arrayValue"].get("values", [])
            new_rems = []
            changed = False
            for rem in rems:
                if "mapValue" in rem and "fields" in rem["mapValue"]:
                    r_fields = rem["mapValue"]["fields"]
                    if "dueDate" in r_fields and "stringValue" in r_fields["dueDate"]:
                        old_date = r_fields["dueDate"]["stringValue"]
                        new_date = add_days_to_date_str(old_date, DAYS_TO_ADD)
                        if new_date != old_date:
                            r_fields["dueDate"]["stringValue"] = new_date
                            changed = True
                new_rems.append(rem)
                
            if changed:
                new_fields["reminders"] = {"arrayValue": {"values": new_rems}}
                update_mask.append("reminders")
                needs_update = True
                
        if needs_update:
            patch_data = {"fields": new_fields}
            if patch_document(doc_name, patch_data, update_mask):
                updated_count += 1
                
    print(f"Updated {updated_count} ca_subjects.")

if __name__ == "__main__":
    print(f"Delaying tasks by {DAYS_TO_ADD} days...")
    process_topics()
    process_ca_subjects()
    print("Done!")
