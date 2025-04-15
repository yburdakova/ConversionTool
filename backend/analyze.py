import os
import sys
import html

records_folder = sys.argv[1]

type_abbr = {
    "Criminal": "CRI",
    "Civil": "CIV",
    "Chancery": "CHA",
    "Fiduciary": "FID"
}
case_type = os.path.basename(records_folder).split(" ")[0]
abbr = type_abbr.get(case_type, "UNK")

html_output = """
<table border="1" cellpadding="5" cellspacing="0">
<thead>
<tr>
<th>Box Number</th>
<th>Finalized</th>
<th>Converted</th>
<th>Status</th>
<th>Action</th>
</tr>
</thead>
<tbody>
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

    finalized_count = len(finalized_folders)
    converted_count = len(converted_files)

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
        status = "Converted"
        action = ""
    else:
        status = "Unknown"
        action = ""

    formatted_box = abbr + "-" + box_name.replace("Box", "")
    row = f"<tr><td>{formatted_box}</td><td>{finalized_count}</td><td>{converted_count}</td><td>{status}</td><td>{action}</td></tr>"
    html_output += row

html_output += "</tbody></table>"

print(html_output)
