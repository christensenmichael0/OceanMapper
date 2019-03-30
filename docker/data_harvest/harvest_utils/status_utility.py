import json

def update_process_status(dataset, status):
    """
    update_process_status(dataset, status)

    This function updates the harvest processing status of a particular dataset

    Inputs:
    dataset (str) - the name of the datset (i.e. hycom, rtofs, gfs, ww3)
    status (st) - the process status ('ready' or 'processing')

    Returns: 
    0 - success
    1 - failure
     -----------------------------------------------------------------------
    Notes: harvest_status.json is updated
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 4/24/2019
    """

    try:
        with open('../harvest_utils/harvest_status.json') as f:
                harvest_status = json.loads(f.read())

        harvest_status[dataset] = status
        with open('../harvest_utils/harvest_status.json','w') as f:
            json.dump(harvest_status,f)

        return 0
    
    except Exception as e:
        return 1