read -p 'Any changes? ' uservar
git add .
git commit -m "Update ${uservar} on `date +'%Y-%m-%d %H:%M:%S'`"
git push origin master