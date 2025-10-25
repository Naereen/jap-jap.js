# Jap Jap! 🃏

A browser-based card game implementation of "Jap Jap" (also known as "Knock" or "Thirty-One" in some regions), built with JavaScript and the cards.js library.

[![Play Now](https://img.shields.io/badge/Play-Now-brightgreen)](https://naereen.github.io/jap-jap.js/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Screenshots

### Game Start
![Game Start](https://github.com/user-attachments/assets/9b320284-8540-49ec-b9ca-26858b59be81)

### Gameplay
![Game in Progress](https://github.com/user-attachments/assets/3997180e-5d0d-4181-8c45-befdd9a83418)

## 📖 About the Game

**Jap Jap** is a strategic card game where players aim to achieve the lowest hand value possible. The objective is to reduce your hand's total value to 5 or less, at which point you can call "JAP JAP!" to win the round. The first player to reach 90 points loses the game!

### Game Rules

1. **Setup**: Each player (you vs. the computer opponent) starts with 5 cards
2. **Hand Values**: Cards are valued by their rank (Ace=1, 2-10=face value, Jack=11, Queen=12, King=13)
3. **Gameplay**:
   - On your turn, select one or more cards from your hand to discard
   - Valid plays must be either:
     - Multiple cards of the same rank (e.g., three 5s)
     - A consecutive sequence of the same suit (e.g., 4♥, 5♥, 6♥)
   - After discarding, draw a card from either:
     - The deck (hidden card)
     - The discard pile (visible top card)
4. **Winning a Round**: When your hand value is 5 or less, click "JAP JAP!" to win the round
5. **Scoring**: The losing player of each round gains points equal to their hand value
6. **Game Over**: First player to reach 90 points loses the game

### Strategy Tips

- Try to form sequences or pairs early to discard high-value cards
- Watch the discard pile for cards that might help you complete a sequence
- Don't wait too long to call "JAP JAP!" - your opponent might beat you to it!
- Sometimes it's worth picking up a high card from the discard pile if it helps you form a valid play

## 🎮 How to Play

1. Open `index.html` in your web browser
2. Click the **DEAL** button to start the game
3. Select cards from your hand by clicking on them (they'll move up when selected)
4. Click the **deck** to draw a hidden card, or click the **discard pile** to pick up the visible top card
5. When your hand value is 5 or less, click the **JAP JAP!** button to win the round

The game is also available in French by opening `index.fr.html`.

## 🚀 Getting Started

### Play Online

Visit [https://naereen.github.io/jap-jap.js/](https://naereen.github.io/jap-jap.js/) to play immediately in your browser.

### Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/Naereen/jap-jap.js.git
   cd jap-jap.js
   ```

2. Open `index.html` in your web browser:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   # Then navigate to http://localhost:8000
   
   # Or simply open the file directly
   open index.html  # macOS
   xdg-open index.html  # Linux
   start index.html  # Windows
   ```

## 📁 Project Structure

- `index.html` - Main game page (English version)
- `index.fr.html` - French version of the game
- `japjap.js` - Game logic and AI implementation
- `cards.js` - Card manipulation library by Einar Egilsson
- `example.css` - Game styling
- `jquery-1.7.min.js` - jQuery library for DOM manipulation
- `img/cards.png` - Card deck sprite sheet

## 🛠️ Technologies Used

- **HTML5** - Game structure
- **CSS3** - Styling and animations
- **JavaScript** - Game logic
- **jQuery** - DOM manipulation
- **[cards.js](http://einaregilsson.github.io/cards.js/)** - Card game framework

## 👥 Authors & Credits

### Game Author
- **Lilian Besson** ([Naereen](https://github.com/Naereen)) - Game design and implementation
  - Website: [https://perso.crans.org/besson/](https://perso.crans.org/besson/)
  - GitHub: [@Naereen](https://github.com/Naereen/)

### Cards.js Library
- **Einar Egilsson** - Creator of the cards.js library
  - Website: [http://einaregilsson.com](http://einaregilsson.com)
  - GitHub: [einaregilsson/cards.js](https://github.com/einaregilsson/cards.js)

### Card Artwork
- **Nicu Buculei** - Card deck images (public domain)
  - Website: [http://nicubunu.ro](http://nicubunu.ro)
  - Source: [OpenClipart.org](https://openclipart.org)

### Development Assistance
This project was developed with assistance from GitHub Copilot.

## 📄 License

Copyright (c) 2024 Lilian Besson (Naereen)

This game implementation is free and open source software. You are free to use, modify, and distribute it.

### Third-Party Licenses

This project incorporates the following third-party components:

- **cards.js**: Licensed under the MIT License by Einar Egilsson - see [LICENSE](LICENSE) file
- **Card Images**: Public domain by Nicu Buculei
- **jQuery**: Licensed under the MIT License

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Naereen/jap-jap.js/issues).

## 🌟 Show Your Support

Give a ⭐️ if you enjoy this game!

## 📝 Notes

- This game is still a work in progress
- The AI opponent uses a simple strategy algorithm
- Mobile support may be limited due to the card selection mechanism

---

*Made with ❤️ by [Lilian Besson](https://github.com/Naereen)*
