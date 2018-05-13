
// Shorthand for $( document ).ready()
$(function() {
    console.log( "ready!" );
    // $('#grab-data').click(function(){alert('going to s3 to grab data')});
    let filename = 'oceanmapper-data-storage/RTOFS_OC/0m/rtofs_currents_20160512_00.json';
    let filetype = 'json';
    getSignedRequest(filename,filetype);
});

function getSignedRequest(filename, filetype){
  debugger
  const xhr = new XMLHttpRequest();
  // xhr.open('GET', `/sign-s3?file-name=${filename}&file-type=${filetype}`);
  xhr.open('GET', `/sign-s3?file-name=${filename}`);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4){
      if(xhr.status === 200){
      	debugger
        const response = JSON.parse(xhr.responseText);
        downloadFile(filename, response.signedRequest, response.url);
      }
      else{
        alert('Could not get signed URL.');
      }
    }
  };
  xhr.send();
}

function downloadFile(filename, signedRequest, url){
  debugger
  const xhr = new XMLHttpRequest();
  // xhr.open('GET', signedRequest);
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
  xhr.open('GET', signedRequest);
  xhr.send();
}


// getSignedRequest(file);