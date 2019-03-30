import sys
sys.path.append("..")

import os
import json
import io
import subprocess

from HYCOM.check_remote import is_data_fresh as is_hycom_fresh
from RTOFS.check_remote import is_data_fresh as is_rtofs_fresh
from GFS.check_remote import is_data_fresh as is_gfs_fresh
from WW3.check_remote import is_data_fresh as is_ww3_fresh

dataset_mapping = {
    'hycom': {'status_checker': is_hycom_fresh, 'harvest_func_path': 'HYCOM/hycom_3d_data_fetch_init.py'},
    'rtofs': {'status_checker': is_rtofs_fresh, 'harvest_func_path': 'RTOFS/rtofs_3d_data_fetch_init.py'},
    'gfs': {'status_checker': is_gfs_fresh, 'harvest_func_path': 'GFS/gfs_data_fetch_init.py'},
    'ww3': {'status_checker': is_ww3_fresh, 'harvest_func_path': 'WW3/ww3_data_fetch_init.py'}

}

def harvest_data():
    '''
    This function loops through datasets in harvest_status.json file and triggers data harvesting
    '''

    with open('harvest_status.json') as f:
        harvest_status = json.loads(f.read())

        # count number of harvest processes running
        num_processing = len([i for i in harvest_status.values() if i == 'processing'])

        # filter on the jobs that are ready to run
        ready_jobs = dict([i for i in harvest_status.items() if i[1] == 'ready'])

        for dataset, status in ready_jobs.items():
            num_processing += 1
            # only allow 2 data harvest processes to run
            if num_processing < 3:
                # kick of harvest for particular datset and increment num_processing
                # check if data is fresh before harvesting.. if it is then continue
                is_fresh = dataset_mapping[dataset]['status_checker']()
                if not is_fresh:
                    # construct filepath of specific harvest script
                    harvest_script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                        dataset_mapping[dataset]['harvest_func_path'])

                    print('launching harvest script for: {}'.format(dataset))
                    subprocess.Popen(['python', harvest_script_path])


if __name__ == "__main__":
    harvest_data()

# run from this parent folder     