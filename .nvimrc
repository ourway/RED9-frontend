:nnoremap <F8> :silent !./node_modules/prettier/bin-prettier.js  --parser babylon --no-semi --write --single-quote % <CR><CR>
"autocmd BufWritePost *.jsx AsyncRun -post=checktime ./node_modules/prettier/bin-prettier.js  --parser babylon --no-semi --write --single-quote %
