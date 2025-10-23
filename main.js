window.addEventListener("load", () => {
    for (let index = 1; index <= 7; index++) {
        const card = `<div class="card">
                    <div class="card-body">
                        <h2 class="card-title fs-3 text-center">Day ${index}</h2>
                        <ul class="list-group list-group-flush">
                                <li class="list-group-item">
                                    <i class="bi bi-thermometer"></i> 25º C - Feels like 24º C
                                </li>
                                <li class="list-group-item">
                                    <i class="bi bi-sun"></i> UV Index: 6
                                </li>
                                <li class="list-group-item">
                                    <i class="bi bi-moisture"></i> 25 % humidity
                                </li>
                                <li class="list-group-item">
                                    <i class="bi bi-wind"></i> 12 Km/h
                                </li>
                                <li class="list-group-item">
                                    <i class="bi bi-umbrella"></i> Chance of rain: 43%
                                </li>
                        </ul>
                    </div>
                </div>`;
        document.getElementById("card-group").innerHTML += card;
    }
});
