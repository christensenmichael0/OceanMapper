u_data_reformatted = [float('{:.3f}'.format(el)) for el in u_data_cleaned_filled.flatten().tolist()]
v_data_reformatted = [float('{:.3f}'.format(el)) for el in v_data_cleaned_filled.flatten().tolist()]

mask_reformatted = [el for el in u_data_cleaned.mask.flatten().tolist()]

# u_data_trunc = np.array(u_data_reformatted).reshape(u_data_cleaned_filled.shape)
# v_data_trunc = np.array(v_data_reformatted).reshape(v_data_cleaned_filled.shape)

lat_reformatted = [float('{:.4f}'.format(el)) for el in lat.tolist()]
lon_reformatted = [float('{:.4f}'.format(el)) for el in lon.tolist()]

full_raw_data_json = {
        'lat': lat_reformatted, 'lon': lon_reformatted, 'u_vel': u_data_reformatted, 'v_vel': v_data_reformatted,
        'mask': mask_reformatted, 'time_origin': datetime.datetime.strftime(time_origin, '%Y%m%d_%H')}