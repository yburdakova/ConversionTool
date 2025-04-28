import os
import sys
from PIL import Image
import fitz
import io

print("Starting convert_box.py...")

try:
    box_name = sys.argv[1]
    main_folder = sys.argv[2]
    duplicate_folder = sys.argv[3]
except IndexError:
    print("Error: Not enough arguments passed to script.")
    sys.exit(1)

print(f"Received box_name: {box_name}")
print(f"Main folder: {main_folder}")
print(f"Duplicate folder: {duplicate_folder}")

box_path = os.path.join(main_folder, box_name)
finalized_path = os.path.join(box_path, "2 Finalized")
converted_path = os.path.join(box_path, "3 Converted")

print(f"Finalized path: {finalized_path}")
print(f"Converted path: {converted_path}")

os.makedirs(converted_path, exist_ok=True)
os.makedirs(duplicate_folder, exist_ok=True)

print("Scanning Finalized folder...")
for case_folder in os.listdir(finalized_path):
    case_path = os.path.join(finalized_path, case_folder)
    if not os.path.isdir(case_path):
        print(f"Skipping non-folder: {case_folder}")
        continue

    print(f"Processing case folder: {case_folder}")
    tiff_files = sorted([
        os.path.join(case_path, f)
        for f in os.listdir(case_path)
        if f.lower().endswith(('.tif', '.tiff'))
    ])

    if not tiff_files:
        print(f"No TIFF files found in: {case_folder}, skipping.")
        continue

    print(f"Found {len(tiff_files)} TIFF files in {case_folder}")


    pdf = fitz.open()

    for idx, file in enumerate(tiff_files, start=1):
        try:
            print(f"Converting file {idx}/{len(tiff_files)}: {file}")
            img = Image.open(file).convert("RGB")
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=75, optimize=True)
            img_bytes = buffer.getvalue()
            img_pdf = fitz.open("jpeg", img_bytes)
            pdf.insert_pdf(img_pdf)
        except Exception as e:
            print(f"Error converting {file}: {e}")

    out_pdf = os.path.join(converted_path, f"{case_folder}.pdf")
    dup_pdf = os.path.join(duplicate_folder, f"{case_folder}.pdf")

    try:
        print(f"Saving PDF to: {out_pdf}")
        pdf.save(out_pdf, deflate=True, garbage=4)
        print(f"Saving duplicate PDF to: {dup_pdf}")
        pdf.save(dup_pdf, deflate=True, garbage=4)
        print(f"Finished case: {case_folder}")
    except Exception as e:
        print(f"Error saving PDF for {case_folder}: {e}")
    finally:
        pdf.close()

print("Conversion script completed.")
