var express=require("express");
var path=require("path");

var apiRouter =require("./routes/api_router");

var app = express();

var staticPath= path.resolve(__dirname,"static");
app.use(express.static(staticPath));

app.use("/api",apiRouter)

app.use(function(req,res){
    res.status(404).send("File or page not found");
})

app.listen(3000,"0.0.0.0", function(){
    console.log("app started on port 3000");

});