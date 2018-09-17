import json

def generate_response(status_code, headers, response_body):
	"""
    This function generates a response object that an application frontend will consume
    -----------------------------------------------------------------------
    Inputs:

    status_code (int): http status codes
    headers (obj): response headers
    response_body (obj): contains key/value pairs
    
    -----------------------------------------------------------------------
    Output: response object
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 09/08/2018
    """

	return {
        'statusCode': status_code,
        'body': json.dumps(response_body),
        'headers': headers
    }
