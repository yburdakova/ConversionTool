import os
import sys
import img2pdf

box_name = sys.argv[1]
main_folder = sys.argv[2]
duplicate_folder = sys.argv[3]

box_path = os.path.join(main_folder, box_name)
finalized_path = os.path.join(box_path, "2 Finalized")
converted_path = os.path.join(box_path, "3 Converted")

os.makedirs(converted_path, exist_ok=True)
os.makedirs(duplicate_folder, exist_ok=True)

for case_folder in os.listdir(finalized_path):
    case_path = os.path.join(finalized_path, case_folder)
    if not os.path.isdir(case_path):
        continue

    tiff_files = sorted([
        os.path.join(case_path, f)
        for f in os.listdir(case_path)
        if f.lower().endswith(('.tif', '.tiff'))
    ])

    if not tiff_files:
        continue 

    out_pdf = os.path.join(converted_path, f"{case_folder}.pdf")
    dup_pdf = os.path.join(duplicate_folder, f"{case_folder}.pdf")

    try:
        with open(out_pdf, "wb") as f1, open(dup_pdf, "wb") as f2:
            pdf_bytes = img2pdf.convert(tiff_files)
            f1.write(pdf_bytes)
            f2.write(pdf_bytes)
            print(f"Converted: {case_folder}")
    except Exception as e:
        print(f" Error with {case_folder}: {e}")
