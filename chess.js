document.addEventListener("DOMContentLoaded", function () {
  const boardElement = document.getElementById('chessboard');

  let currentTurn = 'white';
  let moveHistory = []; // Gunakan satu history saja
  let gameStarted = false;

  const pieceMap = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
  };

  // Pemetaan kebalikan: dari simbol Unicode ke notasi huruf
  const symbolMap = {
    '♜': 'r', '♞': 'n', '♝': 'b', '♛': 'q', '♚': 'k', '♟': 'p',
    '♖': 'R', '♘': 'N', '♗': 'B', '♕': 'Q', '♔': 'K', '♙': 'P'
  };

  // Papan catur yang berisi representasi huruf
  let board = [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R'],
  ];

  const openingBook = {
    "": ["e2e4", "d2d4", "g1f3"],                    // Opening moves
    "e2e4": ["e7e5", "c7c5", "e7e6"],               // Responses to e4
    "d2d4": ["d7d5", "g8f6", "f7f5"],               // Responses to d4
    "e2e4,e7e5": ["g1f3", "f2f4", "b1c3"],          // After e4 e5
    "d2d4,d7d5": ["c2c4", "g1f3", "c1f4"],          // After d4 d5
    "e2e4,c7c5": ["g1f3", "f2f4", "b1c3"],          // Sicilian Defense
    "d2d4,g8f6": ["c2c4", "g1f3", "c1g5"]           // Indian Defense
  };
    
  let selected = null;
  let startRow = null, startCol = null;
  const grid = [];

  // Menampilkan papan catur di HTML
  function renderBoard() {
    console.log("Rendering board:", board);
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const cell = grid[row][col];
        cell.innerHTML = ''; // Bersihkan sel
  
        const piece = board[row][col];
        if (piece) {
          const pieceSpan = document.createElement('span');
          // Konversi huruf ke simbol Unicode
          pieceSpan.textContent = pieceMap[piece] || piece;
          pieceSpan.classList.add('piece');
          pieceSpan.draggable = true;
          pieceSpan.dataset.color = isWhite(piece) ? 'white' : 'black';
          cell.appendChild(pieceSpan);
        }
      }
    }
  }  

  // Fungsi yang tepat untuk menentukan warna dari bidak
  function isWhite(piece) {
    return piece === piece.toUpperCase() && piece !== '';
  }

  function isBlack(piece) {
    return piece === piece.toLowerCase() && piece !== '';
  }

  // Mendapatkan bidak pada posisi tertentu
  function getPieceAt(row, col) {
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
    return board[row][col] || null;
  }

  // Memeriksa apakah jalur antara dua posisi kosong
  function isPathClear(row1, col1, row2, col2) {
    const dRow = Math.sign(row2 - row1);
    const dCol = Math.sign(col2 - col1);
    let r = row1 + dRow;
    let c = col1 + dCol;
    while (r !== row2 || c !== col2) {
      if (getPieceAt(r, c)) return false;
      r += dRow;
      c += dCol;
    }
    return true;
  }

  // Evaluasi posisi papan untuk algoritma minimax
  function evaluateBoard(board) {
    const values = { 
      'p': -1, 'r': -5, 'n': -3, 'b': -3, 'q': -9, 'k': -1000,
      'P': 1, 'R': 5, 'N': 3, 'B': 3, 'Q': 9, 'K': 1000 
    };
    let score = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          score += values[piece] || 0;
          
          // Bonus posisi untuk pion
          if (piece === 'P') {
            score += (6 - row) * 0.1; // Pion putih maju
          } else if (piece === 'p') {
            score -= (row - 1) * 0.1; // Pion hitam maju
          }
          
          // Bonus kontrol tengah
          if ((row >= 3 && row <= 4) && (col >= 3 && col <= 4)) {
            score += isWhite(piece) ? 0.3 : -0.3;
          }
        }
      }
    }
    
    return score;
  }

  function isKingInCheck(board, color) {
    const isWhitePlayer = color === 'white';
    let kingRow = -1, kingCol = -1;
  
    // Temukan posisi raja
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && ((isWhitePlayer && piece === 'K') || (!isWhitePlayer && piece === 'k'))) {
          kingRow = row;
          kingCol = col;
          break;
        }
      }
      if (kingRow !== -1) break;
    }
  
    if (kingRow === -1) return false; // Raja tidak ditemukan
  
    // Periksa apakah ada bidak lawan yang bisa menyerang posisi raja
    const enemyColor = isWhitePlayer ? 'black' : 'white';
    const enemyMoves = generateMoves(board, enemyColor, false); // false = tidak perlu filter check
    return enemyMoves.some(move => move.to.row === kingRow && move.to.col === kingCol);
  }    

  // Algoritma minimax dengan alpha-beta pruning
  function minimax(board, depth, isMaximizing, alpha, beta) {
    if (depth === 0) return evaluateBoard(board);

    const moves = generateMoves(board, isMaximizing ? 'white' : 'black', false);
    
    if (moves.length === 0) {
      // Checkmate atau stalemate
      const color = isMaximizing ? 'white' : 'black';
      if (isKingInCheck(board, color)) {
        return isMaximizing ? -10000 + depth : 10000 - depth; // Favor quick checkmate
      }
      return 0; // Stalemate
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let move of moves) {
        const backup = applyMove(board, move, false);
        const eval = minimax(board, depth - 1, false, alpha, beta);
        undoMove(board, backup);
        maxEval = Math.max(maxEval, eval);
        alpha = Math.max(alpha, eval);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let move of moves) {
        const backup = applyMove(board, move, false);
        const eval = minimax(board, depth - 1, true, alpha, beta);
        undoMove(board, backup);
        minEval = Math.min(minEval, eval);
        beta = Math.min(beta, eval);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  function aiBestMove() {
    console.log("AI thinking...");
    console.log("Current board state:", board);
    console.log("Move history:", moveHistory);

    // Coba dapatkan langkah dari opening book
    const bookMove = getBookMove();
    if (bookMove) {
      console.log("Using opening book move:", bookMove);
      const backup = applyMove(board, bookMove, true);
      renderBoard();
      currentTurn = 'white';
      
      if (isKingInCheck(board, 'white')) {
        alert("White is in check!");
      }
      return;
    }

    const moves = generateMoves(board, 'black', true);
    console.log("Available moves for AI:", moves.length);

    if (moves.length === 0) {
      console.log("No moves available for AI!");
      if (isKingInCheck(board, 'black')) {
        alert("Checkmate! White wins!");
      } else {
        alert("Stalemate!");
      }
      return;
    }

    let bestEval = Infinity;
    let bestMove = null;

    // Randomize moves untuk variety
    const shuffledMoves = [...moves].sort(() => Math.random() - 0.5);

    for (let move of shuffledMoves) {
      const backup = applyMove(board, move, false);
      const eval = minimax(board, 3, true, -Infinity, Infinity); // Depth 3
      undoMove(board, backup);

      if (eval < bestEval) {
        bestEval = eval;
        bestMove = move;
      }
    }

    console.log("Best move found:", bestMove, "with evaluation:", bestEval);
    if (bestMove) {
      const backup = applyMove(board, bestMove, true);
      console.log("Board after AI move:", board);
      renderBoard();
      currentTurn = 'white';
      
      if (isKingInCheck(board, 'white')) {
        alert("White is in check!");
      }
      console.log("Turn changed to white");
    }
  }

  // Menghasilkan semua langkah yang mungkin untuk pemain
  function generateMoves(board, color, filterCheck = true) {
    const moves = [];
    const isWhitePlayer = color === 'white';
  
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;
  
        const isPieceWhite = piece === piece.toUpperCase();
        if (isWhitePlayer !== isPieceWhite) continue;
  
        const type = piece.toLowerCase();
  
        if (type === 'p') {
          const dir = isWhitePlayer ? -1 : 1;
          const startRow = isWhitePlayer ? 6 : 1;
          const nextRow = row + dir;
  
          // Maju 1
          if (inBounds(nextRow, col) && board[nextRow][col] === '') {
            moves.push({ from: { row, col }, to: { row: nextRow, col }, piece });
            
            // Maju 2 dari posisi awal
            if (row === startRow && inBounds(row + 2 * dir, col) && board[row + 2 * dir][col] === '') {
              moves.push({ from: { row, col }, to: { row: row + 2 * dir, col }, piece });
            }
          }
  
          // Makan diagonal
          for (let dc of [-1, 1]) {
            const nc = col + dc;
            if (inBounds(nextRow, nc)) {
              const target = board[nextRow][nc];
              if (target && isPieceWhite !== (target === target.toUpperCase())) {
                moves.push({ from: { row, col }, to: { row: nextRow, col: nc }, piece });
              }
            }
          }
        }
  
        if (type === 'r' || type === 'q') {
          const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1]
          ];
          moves.push(...linearMoves(board, row, col, isPieceWhite, directions));
        }
  
        if (type === 'b' || type === 'q') {
          const directions = [
            [1, 1], [1, -1], [-1, 1], [-1, -1]
          ];
          moves.push(...linearMoves(board, row, col, isPieceWhite, directions));
        }
  
        if (type === 'n') {
          const jumps = [
            [2, 1], [1, 2], [-1, 2], [-2, 1],
            [-2, -1], [-1, -2], [1, -2], [2, -1]
          ];
          for (let [dr, dc] of jumps) {
            const r = row + dr;
            const c = col + dc;
            if (inBounds(r, c)) {
              const target = board[r][c];
              if (!target || isPieceWhite !== (target === target.toUpperCase())) {
                moves.push({ from: { row, col }, to: { row: r, col: c }, piece });
              }
            }
          }
        }
  
        if (type === 'k') {
          const kingMoves = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
          ];
          for (let [dr, dc] of kingMoves) {
            const r = row + dr;
            const c = col + dc;
            if (inBounds(r, c)) {
              const target = board[r][c];
              if (!target || isPieceWhite !== (target === target.toUpperCase())) {
                moves.push({ from: { row, col }, to: { row: r, col: c }, piece });
              }
            }
          }
        }
      }
    }
  
    // Filter langkah yang menyebabkan raja sendiri skak (hanya jika diminta)
    if (filterCheck) {
      return moves.filter(move => {
        const backup = applyMove(board, move, false);
        const inCheck = isKingInCheck(board, color);
        undoMove(board, backup);
        return !inCheck;
      });
    }
    
    return moves;
  }
  
  // Perbaikan untuk opening book
  function getBookMove() {
    const key = moveHistory.join(',');
    console.log("Looking for opening book key:", key);
    
    if (openingBook[key]) {
      const responses = openingBook[key];
      const randomIndex = Math.floor(Math.random() * responses.length);
      const moveStr = responses[randomIndex];
      console.log("Found book move string:", moveStr);

      // Parse move string (format: "e2e4")
      if (moveStr.length === 4) {
        const fromCol = moveStr.charCodeAt(0) - 97; // a=0, b=1, etc
        const fromRow = 8 - parseInt(moveStr[1]);   // 8=0, 7=1, etc
        const toCol = moveStr.charCodeAt(2) - 97;
        const toRow = 8 - parseInt(moveStr[3]);
        
        // Cari langkah yang cocok
        const allMoves = generateMoves(board, 'black', true);
        const matchingMove = allMoves.find(m => 
          m.from.row === fromRow && m.from.col === fromCol &&
          m.to.row === toRow && m.to.col === toCol
        );
        
        if (matchingMove) {
          console.log("Found matching move:", matchingMove);
          return matchingMove;
        }
      }
    }
    return null;
  }

  // Perbaikan konversi move ke string untuk history
  function convertMoveToString(move) {
    if (!move || !move.from || !move.to) return '';
    
    const from = String.fromCharCode(97 + move.from.col) + (8 - move.from.row);
    const to = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
    
    return from + to; // Format: "e2e4"
  }    

  // Menghasilkan langkah-langkah linier untuk benteng, menteri, dan ratu
  function linearMoves(board, row, col, isWhitePlayer, directions) {
    const piece = board[row][col];
    const moves = [];

    for (let [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      while (inBounds(r, c)) {
        const target = board[r][c];
        if (!target) {
          moves.push({ from: { row, col }, to: { row: r, col: c }, piece });
        } else {
          if (isWhitePlayer !== (target === target.toUpperCase())) {
            moves.push({ from: { row, col }, to: { row: r, col: c }, piece });
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }

    return moves;
  }

  // Memeriksa apakah posisi berada dalam papan
  function inBounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col >= 0 && col < 8;
  }

  function updateHistoryDisplay() {
    const historyList = document.getElementById("historyList");
    if (!historyList) return;
    
    historyList.innerHTML = '';
  
    for (let i = 0; i < moveHistory.length; i += 2) {
      const whiteMove = moveHistory[i] || '';
      const blackMove = moveHistory[i + 1] || '';
      const li = document.createElement('li');
      li.textContent = `${Math.floor(i/2) + 1}. ${whiteMove} ${blackMove}`.trim();
      historyList.appendChild(li);
    }
  }       

  // Menerapkan gerakan ke papan
  function applyMove(board, move, isRealMove = true) {
    const { from, to, piece } = move;
  
    const captured = board[to.row][to.col];
    const backup = {
      from: { ...from },
      to: { ...to },
      fromPiece: piece,
      toPiece: captured
    };
  
    board[to.row][to.col] = piece;
    board[from.row][from.col] = '';
  
    // Simpan ke history jika ini langkah nyata
    if (isRealMove) {
      const moveStr = convertMoveToString(move);
      moveHistory.push(moveStr);
      updateHistoryDisplay();
      console.log("Move added to history:", moveStr);
    }
  
    return backup;
  }    
  
  // Membatalkan gerakan (untuk algoritma minimax)
  function undoMove(board, backup) {
    const { from, to, fromPiece, toPiece } = backup;
  
    board[from.row][from.col] = fromPiece; // Kembalikan bidak ke asal
    board[to.row][to.col] = toPiece || '';  // Kembalikan bidak yang dimakan (jika ada)
  
    return board;
  }

  // Membuat papan catur HTML
  function createBoard() {
    for (let row = 0; row < 8; row++) {
      grid[row] = [];
      for (let col = 0; col < 8; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell ' + ((row + col) % 2 === 0 ? 'white' : 'black');
        cell.dataset.row = row;
        cell.dataset.col = col;

        let piece = board[row][col]; // Mengambil dari array board
        
        if (piece) {
          const pieceSpan = document.createElement('span');
          pieceSpan.textContent = pieceMap[piece]; // Konversi ke simbol Unicode
          pieceSpan.classList.add('piece');
          pieceSpan.draggable = true;
          pieceSpan.dataset.color = isWhite(piece) ? 'white' : 'black';
          cell.appendChild(pieceSpan);
        }

        // Drag events
        cell.addEventListener('dragstart', (e) => {
          if (e.target.classList.contains('piece')) {
            const color = e.target.dataset.color;
            if (color !== currentTurn) {
              e.preventDefault(); // Bukan gilirannya
              return;
            }
            selected = e.target;
            startRow = parseInt(cell.dataset.row);
            startCol = parseInt(cell.dataset.col);
            console.log("Starting drag from", startRow, startCol);
          }
        });

        cell.addEventListener('dragover', (e) => {
          e.preventDefault();
        });

        cell.addEventListener('drop', (e) => {
          e.preventDefault();
          const endRow = parseInt(cell.dataset.row);
          const endCol = parseInt(cell.dataset.col);
          console.log("Dropping at", endRow, endCol);

          if (!selected) return;

          const pieceSymbol = selected.textContent;
          const pieceChar = symbolMap[pieceSymbol]; // Konversi simbol ke huruf
          const color = selected.dataset.color;
          
          console.log("Piece:", pieceSymbol, "=>", pieceChar);
          console.log("Color:", color);

          // Cek apakah kotak tujuan berisi bidak
          const targetPiece = board[endRow][endCol];
          console.log("Target piece:", targetPiece);
          
          // Tentukan warna bidak target (jika ada)
          let targetColor = null;
          if (targetPiece) {
            targetColor = isWhite(targetPiece) ? 'white' : 'black';
          }
          console.log("Target color:", targetColor);

          // Mencegah memakan bidak sendiri
          if (targetColor === color) {
            console.log("Cannot capture your own piece");
            return;
          }

          // Buat move object
          const move = {
            from: { row: startRow, col: startCol },
            to: { row: endRow, col: endCol },
            piece: pieceChar
          };

          // Periksa apakah move legal
          const legalMoves = generateMoves(board, color, true);
          const isLegal = legalMoves.some(m => 
            m.from.row === move.from.row && m.from.col === move.from.col &&
            m.to.row === move.to.row && m.to.col === move.to.col
          );

          console.log("Move legal:", isLegal);

          if (isLegal) {
            // Apply move
            const backup = applyMove(board, move, true);
            console.log("Updated board:", board);
          
            // Update tampilan HTML
            cell.innerHTML = '';
            cell.appendChild(selected);
          
            currentTurn = (currentTurn === 'white') ? 'black' : 'white';
            const opponent = currentTurn;
            if (isKingInCheck(board, opponent)) {
              alert(`${opponent.charAt(0).toUpperCase() + opponent.slice(1)} is in check!`);
            }
            console.log("Turn changed to", currentTurn);
          
            if (currentTurn === 'black') {
              console.log("AI's turn to move");
              setTimeout(() => aiBestMove(), 500);
            }
          } else {
            console.log("Illegal move attempted");
          }
        });

        grid[row][col] = cell;
        boardElement.appendChild(cell);
      }
    }
  }

  createBoard();
});