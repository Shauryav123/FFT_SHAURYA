const books = [
    ["The Midnight Library", "Matt Haig", "Fiction", 999, "9780525559474"],
    ["Atomic Habits", "James Clear", "Self-help", 1549, "9780735211292"],
    ["The House in the Cerulean Sea", "TJ Klune", "Fantasy", 1299, "9781250217288"],
    ["Tomorrow, and Tomorrow", "Gabrielle Zevin", "Fiction", 1399, "9780593321201"],
    ["A Brief History of Time", "Stephen Hawking", "Science", 1699, "9780553380163"],
    ["Ikigai", "Héctor García", "Wellness", 999, "9780143130727"],
    ["The Creative Act", "Rick Rubin", "Art", 1799, "9780593652886"],
    ["The Alchemist", "Paulo Coelho", "Classics", 899, "9780062315007"]
];

let selectedGenre = "All";
let cart = [];

function showFilters() {
    const genres = ["All"];
    books.forEach(function (book) {
        if (!genres.includes(book[2])) genres.push(book[2]);
    });

    document.getElementById("filters").innerHTML = genres.map(function (genre) {
        return `<button class="${genre === selectedGenre ? "selected" : ""}"
            data-genre="${genre}">${genre}</button>`;
    }).join("");
}

function showBooks() {
    const search = document.getElementById("search").value.toLowerCase();
    const list = books.filter(function (book) {
        const hasGenre = selectedGenre === "All" || book[2] === selectedGenre;
        const hasSearch = (book[0] + book[1]).toLowerCase().includes(search);
        return hasGenre && hasSearch;
    });

    document.getElementById("bookList").innerHTML = list.map(function (book, index) {
        return `<div class="book">
            <img src="https://covers.openlibrary.org/b/isbn/${book[4]}-M.jpg"
                alt="${book[0]} cover">
            <div class="book-info">
                <h3>${book[0]}</h3>
                <p>Author: ${book[1]}</p>
                <p class="genre">Genre: ${book[2]}</p>
                <p class="price">Rs. ${book[3].toLocaleString("en-IN")}</p>
                <button class="add" data-index="${books.indexOf(book)}">Add to cart</button>
            </div>
        </div>`;
    }).join("");

    document.getElementById("noBooks").hidden = list.length > 0;
}

function showCart() {
    let total = 0;
    document.getElementById("cartItems").innerHTML = cart.map(function (item) {
        total += item[3];
        return `<div class="cart-item">${item[0]} - Rs. ${item[3].toLocaleString("en-IN")}</div>`;
    }).join("");
    document.getElementById("cartCount").textContent = cart.length;
    document.getElementById("total").textContent = total.toLocaleString("en-IN");
}

document.getElementById("filters").addEventListener("click", function (event) {
    if (event.target.dataset.genre) {
        selectedGenre = event.target.dataset.genre;
        showFilters();
        showBooks();
    }
});

document.getElementById("bookList").addEventListener("click", function (event) {
    if (event.target.dataset.index) {
        cart.push(books[event.target.dataset.index]);
        showCart();
        alert("Book added to cart");
    }
});

document.getElementById("search").addEventListener("input", showBooks);

document.getElementById("cartButton").addEventListener("click", function () {
    document.getElementById("cart").classList.add("open");
    document.getElementById("shade").hidden = false;
});

function closeCart() {
    document.getElementById("cart").classList.remove("open");
    document.getElementById("shade").hidden = true;
}

document.getElementById("closeCart").addEventListener("click", closeCart);
document.getElementById("shade").addEventListener("click", closeCart);

showFilters();
showBooks();
showCart();
