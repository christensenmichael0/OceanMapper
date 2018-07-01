import random
import time
import netCDF4

class NetworkError(RuntimeError):
    pass

# http://pragmaticcoders.com/blog/retrying-exceptions-handling-internet-connection-problems/
def retryer(max_retries=100, max_wait=20):
    def wraps(func):
        os_exceptions = (
            OSError
        )
        def inner(*args, **kwargs):
            for i in range(max_retries):
                try:    
                    result = func(*args, **kwargs)
                except os_exceptions:
                    time.sleep(rand.randrange(max_wait))
                    continue
                else:
                    return result
            else:
                raise NetworkError
        return inner
    return wraps


@retryer(max_retries=100, max_wait=10)
def get_opendapp_netcdf(url):
    return netCDF4.Dataset(url)