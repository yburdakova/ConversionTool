import os
import sys
import html

records_folder = sys.argv[1]
duplicate_folder = sys.argv[2]

type_abbr = {
    "Criminal": "CRI",
    "Civil": "CIV",
    "Chancery": "CHA",
    "Fiduciary": "FID"
}
case_type = os.path.basename(records_folder).split(" ")[0]
abbr = type_abbr.get(case_type, "UNK")

html_output = """
<div class="grid-header-container">
  <div class="grid-header box-column">Box Number</div>
  <div class="grid-header">Finalized</div>
  <div class="grid-header">Converted</div>
  <div class="grid-header">Duplicated</div>
  <div class="grid-header">Status</div>
  <div class="grid-header">Action</div>
</div>
<div class="grid-body-wrapper">
    <div class="grid-body-container">
"""


for box_name in os.listdir(records_folder):
    box_path = os.path.join(records_folder, box_name)

    if not os.path.isdir(box_path) or not box_name.lower().startswith("box"):
        continue

    finalized_path = os.path.join(box_path, "2 Finalized")
    converted_path = os.path.join(box_path, "3 Converted")

    try:
        finalized_folders = [
            name for name in os.listdir(finalized_path)
            if os.path.isdir(os.path.join(finalized_path, name))
        ]
    except FileNotFoundError:
        finalized_folders = []

    try:
        converted_files = [
            f for f in os.listdir(converted_path)
            if f.lower().endswith('.pdf')
        ]
    except FileNotFoundError:
        converted_files = []

    try:
        dublicated_files = [
            f for f in os.listdir(duplicate_folder)
            if f.lower().endswith('.pdf')
        ]
    except FileNotFoundError:
        dublicated_files = []

    finalized_count = len(finalized_folders)
    converted_count = len(converted_files)

    converted_names = {os.path.splitext(f)[0] for f in converted_files}
    dublicated_names = {os.path.splitext(f)[0] for f in dublicated_files}
    dublicated_count = len(converted_names & dublicated_names)

    if finalized_count == 0 and converted_count == 0:
        status = "Doesn't Ready"
        action = f"<button onclick=\"copyBox('{box_name}')\">Copy</button>"
    elif finalized_count > 0 and converted_count == 0:
        status = "Not Converted"
        action = f"<button onclick=\"convertBox('{box_name}')\">Convert</button>"
    elif converted_count < finalized_count:
        status = "Partially Converted"
        action = f"<button onclick=\"reconvertBox('{box_name}')\">Reconvert</button>"
    elif converted_count >= finalized_count:
        if dublicated_count < converted_count:
            status = "Duplication Missing"
            action = f"<button onclick=\"duplicateBox('{box_name}')\">Duplicate</button>"
        else:
            status = "Converted"
            action = f"<button onclick=\"copyBox('{box_name}')\">Copy</button>"
    else:
        status = "Unknown"
        action = ""

    formatted_box = abbr + "-" + box_name.replace("Box", "")

    row = f"""
        <div class="grid-row">
        <div class="grid-item box-column">{formatted_box}</div>
        <div class="grid-item">{finalized_count}</div>
        <div class="grid-item">{converted_count}</div>
        <div class="grid-item">{dublicated_count}</div>
        <div class="grid-item">{status}</div>
        <div class="grid-item action-btn">{action}</div>
        </div>
    """

    html_output += row

html_output += "</div></div>"

print(html_output)
