var express=require("express");
var path=require("path");



var app = express();

var publicPath= path.resolve(__dirname,"public");
var imagesPath= path.resolve(__dirname,"images");

app.use("/public", express.static(publicPath));
app.use("/images", express.static(imagesPath));



app.use(function(req,res){
    res.status(404).send("File or page not found");
})

app.listen(3000, function(){
    console.log("app started on port 3000");

});