import boto3
import datetime
import os
import re
import io

import geopandas
import requests
from PyPDF2 import PdfFileReader

def text_extractor(fileObj):
  pdf = PdfFileReader(fileObj)

  combined_text = ''
  for page_indx in range(pdf.getNumPages()):
    page = pdf.getPage(page_indx)
    text = page.extractText()
    header_row_tail = 'Rig Name\n'
    start_indx = text.index(header_row_tail) + len(header_row_tail)
    trimmed_text = text[start_indx:]
    combined_text += trimmed_text

  return combined_text

file_url = "https://bsee.gov/weeklyreport/deepwater_activity/current_report"
resp = requests.get(file_url)

with io.BytesIO() as pdf:
  pdf.write(resp.content)
  raw_text = text_extractor(pdf).replace('\n', '::').replace('\r', '')
  
pattern = r'[\w\s.&]+::\w{2}\s+\d*::[\w\d]+::[^:]*::[\d,]*:{0,2}[^:]+' # good!!!
records = re.findall(pattern, raw_text)

# TODO update this when running in aws i.e. /blocks
block_path = 'blocks/blocks.shp'
block_path = '/home/mchriste/Desktop/shapefiles/blocks/blocks.shp'
df_blocks = geopandas.read_file(block_path)

block_dict = {}
for index, row in df_blocks.iterrows():
  try:
    block_name = row['AC_LAB']
    block_center = [row.geometry.centroid.coords[0][0],row.geometry.centroid.coords[0][1]] # lon, lat
    block_dict.setdefault(block_name, block_center)
  except:
    print('block failed!!')
    continue

# various patterns
depth_pattern = r'[\d,]+'

# loop through records and create some json
active_drilling_output = []
for record in records:

  # Assume a record will always contain an operator, block, well_target_lease, rig name
  try:
    record_split = record.split('::')
    operator = record_split[0]
    block = record_split[1].replace(' ','')
    well_target_lease = record_split[2]
    
    prospect_name = record_split[3] if not re.search(depth_pattern, record_split[3]) else 'n/a'
    # water depth is second to last
    water_depth = record_split[-2] if re.search(depth_pattern, record_split[-2]) else 'n/a'

    # rig name is always last
    rig_name = record_split[-1] if len(record_split)>=5 else 'n/a'

    #get coordinates of block
    coords = block_dict.get(block, None)

    drilling_info_obj = {
      'operator': operator,
      'block': block,
      'coordinates': coords or '',
      'well_target_lease': well_target_lease,
      'prospect_name': prospect_name,
      'water_depth': water_depth + '(ft)',
      'rig_name': rig_name
    }

    active_drilling_output.append(drilling_info_obj)
  except:
    print('in failure block!')
    print(record)
    continue

# TODO: create a lambda function
print('need to save to a json file on s3.. and run on a cron')

