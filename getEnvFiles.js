const testFolder = './env/';
const fs = require('fs');

function getenv(){
var files = [];
fs.readdirSync(testFolder).forEach(file => {
    if(file.includes('.json')){
        files.push(file.replace('.json',''));
    }
});
var filesArray = [];
for(var i in files) {
    var item = files[i];
    filesArray.push({ 
        'fileName' : item,
    });
}
return filesArray;
}

module.exports={getenv}
//console.log(files);