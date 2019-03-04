const express= require ('express');
const mongoose=require ('mongoose');
const bodyparser=require('body-parser');
const request=require('request-promise');
var dburl='mongodb://mtayab:1234par@ds133622.mlab.com:33622/weather';
const app=express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({ extended: true }));
mongoose.connect(dburl);
mongoose.connection.on('connected', function() 
{
   console.log('Mongoose connected to :' + ' ' +  dburl);
});

mongoose.connection.on('error', function(err) 
{
   console.log('Mongoose connection error: ' + ' ' + err);
});

mongoose.connection.on('disconnected', function() 
{ 
  console.log('Mongoose disconnected');
});

function gracefulShutdown(msg, callback) 
{
  mongoose.connection.close(function()  
  {
    console.log('Mongoose disconnected through ' + ' ' + msg);
    callback();
  });
}

process.on('SIGINT', function() 
{
    gracefulShutdown('App termination (SIGINT)', function() 
    {
    
      process.exit(0);
  });
});

var citySchema = new mongoose.Schema({
    name : String 
});

var cityModel = mongoose.model('City', citySchema);

async function getWeather(cities) {
    var weather_data = [];

    for (var city_obj of cities) {
        var city = city_obj.name;
        var url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=d41019f7a4f5b7cf8e57376b62bbf661`;

        var response_body = await request(url);

        var weather_json = JSON.parse(response_body);

        var weather = {
            city : city,
            temperature : Math.round(weather_json.main.temp),
            humidity:Math.round(weather_json.main.humidity),
            wind:Math.round(weather_json.wind.speed),
            pressure:Math.round(weather_json.main.pressure),
            description : weather_json.weather[0].description,
            icon : weather_json.weather[0].icon
        };

        weather_data.push(weather);
    }

    return weather_data;
}

app.get('/', function(req, res) {

    cityModel.find({}, function(err, cities) {

        getWeather(cities).then(function(results) {

            var weather_data = {weather_data : results};

            res.render('app', weather_data);

        });

    });      

});

app.post('/', function(req, res) {

    var newCity = new cityModel({name : req.body.city_name});
    newCity.save().then(function(){
       console.log("New City is Added Successfully!");
    });
    res.redirect('/');

});

app.listen(3000,function()
{
    console.log("Running on 3000 Port");
});
