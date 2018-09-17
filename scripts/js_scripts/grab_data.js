
// Shorthand for $( document ).ready()
$(function() {
    console.log( "ready!" );
    // $('#grab-data').click(function(){alert('going to s3 to grab data')});
    let fileName = 'RTOFS_OC/0m/rtofs_currents_20160512_00.json';
    // getSignedRequest(fileName);
    // listFiles();
    // downloadFile()

});



function getSignedRequest(fileName){
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `/sign-s3?file-name=${fileName}`);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4){
      if(xhr.status === 200){
      	debugger
        const response = JSON.parse(xhr.responseText);
        alert(response.signedRequest);
        alert(response.url)
        downloadFile(filename, response.signedRequest, response.url);
      }
      else{
        alert('Could not get signed URL.');
      }
    }
  };
  xhr.send();
}

function downloadFile(){
  debugger
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `/download`);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4){
      if(xhr.status === 200){
      	debugger
        // document.getElementById('preview').src = url;
        // document.getElementById('avatar-url').value = url;
      }
      else{
        alert('Could not upload file.');
      }
    }
  };
  xhr.send();
}

function listFiles(){
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `/list-files`);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4){
      if(xhr.status === 200){
      	debugger
        const response = JSON.parse(xhr.responseText);
        // downloadFile(filename, response.signedRequest, response.url);
      }
      else{
        alert('Could not get signed URL.');
      }
    }
  };
  xhr.send();
}


var velocityLayer = L.velocityLayer({
		displayValues: true,
		displayOptions: {
			velocityType: 'GBR Water',
			displayPosition: 'bottomleft',
			displayEmptyString: 'No water data'
		},
		data: data,
		maxVelocity: 1.0,
		velocityScale: 0.1 // arbitrary default 0.005
	});

  map.addLayer(velocityLayer)

// getSignedRequest(file);