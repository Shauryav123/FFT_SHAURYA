const API_KEY = "f914f86f20870ab64bac31c246db975b";

function getWeather() {

    let city = document.getElementById("city").value;

    if (city === "") {

        document.getElementById("error").innerHTML =
            "Please enter a city name.";

        return;
    }

    document.getElementById("loading").innerHTML =
        "Loading...";

    document.getElementById("error").innerHTML = "";

    let url =
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    fetch(url)

        .then(function(response) {

            if (!response.ok) {
                throw new Error("City not found");
            }

            return response.json();
        })

        .then(function(data) {

            console.log(data);

            document.getElementById("cityName").innerHTML =
                data.name;

            document.getElementById("temperature").innerHTML =
                "Temperature: " + data.main.temp + " °C";

            document.getElementById("humidity").innerHTML =
                "Humidity: " + data.main.humidity + "%";

            document.getElementById("wind").innerHTML =
                "Wind Speed: " + data.wind.speed + " m/s";

            document.getElementById("condition").innerHTML =
                "Condition: " + data.weather[0].description;

            let icon = data.weather[0].icon;

            document.getElementById("weatherIcon").src =
                `https://openweathermap.org/img/wn/${icon}@2x.png`;

            document.getElementById("loading").innerHTML = "";
        })

        .catch(function(error) {

            document.getElementById("loading").innerHTML = "";

            document.getElementById("error").innerHTML =
                "City not found. Please try again.";

            console.log(error);
        });
}