import moment from 'moment';

export const formatDateTime  = (milliseconds, date_format = 'MM-DD-YYYY', suffix = ' UTC') => {
  let formattedDateTime = `${moment(milliseconds).utc().format(date_format)}${suffix}`;
  return formattedDateTime
}