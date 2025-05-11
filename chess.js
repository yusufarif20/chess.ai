document.addEventListener("DOMContentLoaded", function () {
    const boardElement = document.getElementById('chessboard');
  
    let currentTurn = 'white';
    const pieces = {
      black: ['♜','♞','♝','♛','♚','♝','♞','♜'],
      white: ['♖','♘','♗','♕','♔','♗','♘','♖'],
      blackPawns: '♟',
      whitePawns: '♙'
    };
  
    // Pemetaan komprehensif antara notasi huruf dan simbol Unicode
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
        'p': -1, 'r': -5, 'n': -3, 'b': -3, 'q': -9, 'k': -999,
        'P': 1, 'R': 5, 'N': 3, 'B': 3, 'Q': 9, 'K': 999 
      };
      let score = 0;
      for (let row of board) {
        for (let cell of row) {
          if (cell) score += values[cell] || 0;
        }
      }
      return score;
    }
  
    // Algoritma minimax dengan alpha-beta pruning
    function minimax(board, depth, isMaximizing, alpha, beta) {
      if (depth === 0) return evaluateBoard(board);
  
      const moves = generateMoves(board, isMaximizing ? 'white' : 'black');
  
      if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of moves) {
          const backup = applyMove(board, move);
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
          const backup = applyMove(board, move);
          const eval = minimax(board, depth - 1, true, alpha, beta);
          undoMove(board, backup);
          minEval = Math.min(minEval, eval);
          beta = Math.min(beta, eval);
          if (beta <= alpha) break;
        }
        return minEval;
      }
    }
  
    // AI membuat langkah terbaik
    function aiBestMove() {
      console.log("AI thinking...");
      console.log("Current board state:", board);
      
      const moves = generateMoves(board, 'black');
      console.log("Available moves for AI:", moves);
      
      if (moves.length === 0) {
        console.log("No moves available for AI!");
        return;
      }
      
      let bestEval = Infinity;
      let bestMove = null;
  
      for (let move of moves) {
        console.log("Evaluating move:", move);
        const backup = applyMove(board, move);
        const eval = minimax(board, 2, true, -Infinity, Infinity); // Kedalaman 2 untuk kinerja lebih baik
        undoMove(board, backup);
        console.log("Move evaluation:", eval);
  
        if (eval < bestEval) {
          bestEval = eval;
          bestMove = move;
        }
      }
  
      console.log("Best move found:", bestMove);
      if (bestMove) {
        const backup = applyMove(board, bestMove);
        console.log("Board after AI move:", board);
        renderBoard(); // update tampilan HTML dengan fungsi yang memetakan huruf ke simbol
        currentTurn = 'white';
        console.log("Turn changed to white");
      }
    }
  
    // Menghasilkan semua langkah yang mungkin untuk pemain
    function generateMoves(board, color) {
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
            }
    
            // Maju 2 dari posisi awal
            if (row === startRow && board[nextRow][col] === '' && inBounds(row + 2 * dir, col) && board[row + 2 * dir][col] === '') {
              moves.push({ from: { row, col }, to: { row: row + 2 * dir, col }, piece });
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
    
      return moves;
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
      return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
  
    // Menerapkan gerakan ke papan
    function applyMove(board, move) {
      const { from, to, piece } = move;
    
      const captured = board[to.row][to.col]; // Simpan bidak yang tertangkap
      board[to.row][to.col] = piece;
      board[from.row][from.col] = '';
    
      const backup = {
        fromPiece: piece,
        toPiece: captured,
        from: { ...from },
        to: { ...to }
      };
    
      return backup;
    }  
  
    // Membatalkan gerakan (untuk algoritma minimax)
    function undoMove(board, backup) {
      const { from, to, fromPiece, toPiece } = backup;
    
      board[from.row][from.col] = fromPiece; // Kembalikan bidak ke asal
      board[to.row][to.col] = toPiece;       // Kembalikan bidak yang dimakan (jika ada)
    
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
  
            // Periksa validitas gerakan
            let valid = false;
            
            // Dapatkan jenis bidak dalam huruf lowercase
            const pieceType = pieceChar.toLowerCase();
            console.log("Piece type:", pieceType);
  
            // ======= Pion ========
            if (pieceType === 'p') {
              const dir = (color === 'white') ? -1 : 1;
              const startRank = (color === 'white') ? 6 : 1;
  
              // Maju
              if (startCol === endCol && !targetPiece) {
                if (endRow === startRow + dir) valid = true;
                else if (startRow === startRank && endRow === startRow + 2 * dir &&
                         !getPieceAt(startRow + dir, startCol)) {
                  valid = true;
                }
              }
  
              // Makan secara diagonal
              if (Math.abs(endCol - startCol) === 1 && endRow === startRow + dir && targetPiece && targetColor !== color) {
                valid = true;
              }
            }
  
            // ======= Queen ========
            if (pieceType === 'q') {
              const rowDiff = Math.abs(endRow - startRow);
              const colDiff = Math.abs(endCol - startCol);
  
              const isDiagonal = rowDiff === colDiff;
              const isStraight = startRow === endRow || startCol === endCol;
  
              if ((isDiagonal || isStraight) && isPathClear(startRow, startCol, endRow, endCol)) {
                valid = true;
              }
            }
  
            // ======= Rook ========
            if (pieceType === 'r') {
              const isStraight = startRow === endRow || startCol === endCol;
              if (isStraight && isPathClear(startRow, startCol, endRow, endCol)) {
                valid = true;
              }
            }
  
            // ======= Bishop ========
            if (pieceType === 'b') {
              const isDiagonal = Math.abs(endRow - startRow) === Math.abs(endCol - startCol);
              if (isDiagonal && isPathClear(startRow, startCol, endRow, endCol)) {
                valid = true;
              }
            }
  
            // ======= Knight ========
            if (pieceType === 'n') {
              const dx = Math.abs(endCol - startCol);
              const dy = Math.abs(endRow - startRow);
              if ((dx === 2 && dy === 1) || (dx === 1 && dy === 2)) {
                valid = true;
              }
            }
  
            // ======= King ========
            if (pieceType === 'k') {
              const dx = Math.abs(endCol - startCol);
              const dy = Math.abs(endRow - startRow);
              if (dx <= 1 && dy <= 1) {
                valid = true;
              }
            }
  
            console.log("Move valid:", valid);
  
            if (valid) {
              // Update array board dengan representasi huruf
              board[endRow][endCol] = pieceChar;
              board[startRow][startCol] = '';
              console.log("Updated board:", board);
            
              // Update tampilan HTML
              cell.innerHTML = '';
              cell.appendChild(selected);
            
              currentTurn = (currentTurn === 'white') ? 'black' : 'white';
              console.log("Turn changed to", currentTurn);
            
              if (currentTurn === 'black') {
                console.log("AI's turn to move");
                setTimeout(() => aiBestMove(), 500);
              }
            }
          });
  
          grid[row][col] = cell;
          boardElement.appendChild(cell);
        }
      }
    }
  
    createBoard();
  });