FROM python:3.7-alpine

RUN apk update && apk upgrade

# https://github.com/occ-data/docker-jupyter/blob/master/Dockerfile
# https://gist.github.com/orenitamar/f29fb15db3b0d13178c1c4dd611adce2
# https://github.com/gliderlabs/docker-alpine/blob/master/docs/usage.md
# https://github.com/smizy/docker-keras-tensorflow/blob/master/Dockerfile

RUN apk add --no-cache \
	--repository http://dl-cdn.alpinelinux.org/alpine/edge/main \
    --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing \
	alpine-sdk \
	libxslt-dev \
	libxml2-dev \
	libc-dev \
	openssl-dev \
	libffi-dev \
	openssh \
	ca-certificates \
	cmake \
	freetype-dev \
	build-base \
	g++ \
	gcc \
	gfortran \
	git \
	lapack-dev \
	libpng-dev \
	libstdc++ \
	linux-headers \
	m4 \
	make \
	unzip \
	musl-dev \
	wget \
	zlib-dev \
	hdf5 \
	hdf5-dev \
	sqlite \
	sqlite-libs \
	sqlite-dev \
	curl \
	curl-dev \
	# proj4 \
	# proj4-dev \
	gdal-dev \
	geos-dev \
	&& ln -s /usr/include/locale.h /usr/include/xlocale.h \
	&& pip3 install --upgrade pip

# HDF5 Installation from source
# RUN wget https://www.hdfgroup.org/package/bzip2/?wpdmdl=4300 \
#     && mv "index.html?wpdmdl=4300" hdf5-1.10.1.tar.bz2 \
#     && tar xf hdf5-1.10.1.tar.bz2 \
#     && cd hdf5-1.10.1 \
#     && ./configure --prefix=/usr --enable-cxx --with-zlib=/usr/include,/usr/lib/x86_64-linux-gnu \
#     && make -j4 \
#     && make install \
#     && cd .. \
#     && rm -rf hdf5-1.10.1 \
#     && rm -rf hdf5-1.10.1.tar.bz2 \
# 	&& export HDF5_DIR=/usr

RUN export HDF5_DIR=/usr
RUN HDF5_LIBDIR=/usr/lib HDF5_INCDIR=/usr/include python3 -m pip --no-cache-dir install \
	--no-binary=h5py h5py cython

# PROJ4 Installation
RUN wget http://download.osgeo.org/proj/proj-6.0.0.tar.gz \
	&& tar -zxvf proj-6.0.0.tar.gz \
	&& cd proj-6.0.0 \
	&& ./configure --prefix=/usr \
	&& make -j4 \
	&& make install \
	&& cd .. \
    && rm -rf proj-6.0.0 \
    && rm -rf proj-6.0.0.tar.gz

# NetCDF Installation
RUN wget ftp://ftp.unidata.ucar.edu/pub/netcdf/netcdf-c-4.6.3.tar.gz \
    && tar -zxvf netcdf-c-4.6.3.tar.gz \
    && cd netcdf-c-4.6.3 \
    && ./configure --enable-netcdf-4 --enable-dap --enable-shared --prefix=/usr \
    && make -j4 \
    && make install \
    && cd .. \
    && rm -rf netcdf-c-4.6.3 \
    && rm -rf netcdf-c-4.6.3.tar.gz

# GEOS Installation
# RUN wget http://download.osgeo.org/geos/geos-3.6.2.tar.bz2 \
#         && tar xf geos-3.6.2.tar.bz2 \
#         && cd geos-3.6.2 \
#         && ./configure --prefix=/usr \
#         && make -j4 \
#         && make install \
#         && cd .. \
#         && rm -rf geos-3.6.2 \
#         && rm -rf geos-3.6.2.tar.bz2

# GDAL Installation
# RUN git clone https://github.com/OSGeo/gdal.git /gdalgit \
#         && cd /gdalgit/gdal \
#         && ./configure --prefix=/usr \
#         && make \
#         && make install \
# 	&& cd / \
# 	&& rm -rf gdalgit

# Copy the project dependencies
COPY install/install_python_packages.sh /install/install_python_packages.sh
COPY requirements.txt /requirements.txt

# Install the project dependencies
RUN chmod 755 /install/install_python_packages.sh
RUN /install/install_python_packages.sh

# Copy data harvesting scripts
COPY /data_harvest /data_harvest

ADD crontab.txt /crontab.txt
ADD data_harvest_script.sh /data_harvest_script.sh
COPY entry.sh /entry.sh
RUN chmod 755 /data_harvest_script.sh /entry.sh
RUN /usr/bin/crontab /crontab.txt

CMD ["/entry.sh"]