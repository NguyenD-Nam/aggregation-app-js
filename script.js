const input = document.getElementById('input');
const reposContainer = document.getElementById('repos__container');
const sortDetails = document.getElementById('sort__details');
const sortBtns = document.querySelectorAll('.sort__btn');
const sortStates = {
    stars: 0,
    popular: 1,
    original: 2
};
let curInputVal = '';
let repoList = []; // Total repos
let displayedRepoList = []; // Displaying repos
let curSortCriteria = 'stars';


sortBtns.forEach(function(button) {
    button.addEventListener('click', function(){
        const value = button.getAttribute('data-value');
        setSortCriteria(value);
    })
})


function setSortCriteria(criteria) {
    sortBtns.forEach(function(button) {
        button.classList.remove('sort-button--active');
    })
    sortBtns[sortStates[criteria]].classList.add('sort-button--active');

    if(criteria != curSortCriteria) {
        curSortCriteria = criteria;
        let curSort = curSortCriteria[0].toUpperCase() + curSortCriteria.slice(1);
        let sortInfo = `
            <b>${curSort}</b>
        `;
        sortDetails.innerHTML = 'Current sort criteria: ';
        sortDetails.insertAdjacentHTML('beforeEnd', sortInfo);
        
        reposContainer.innerHTML = '';
        showRepos();
    }
}


/* Event delegation to remove repo card */
reposContainer.onclick = (event) => {
    if(event.target.className == 'del__button') {
        let closestEle = event.target.closest('.repo__card');

        closestEle.style.maxHeight = '0';
        closestEle.style.margin = '0';
        setTimeout(() => {
            closestEle.remove();
        }, 500);
    }
}


/* Process input data on Enter */
input.addEventListener('keypress', function(event) {
    if(event.key == 'Enter'){
        getInputVal();
    }
});


function getInputVal() {
    if(input.value != '' && input.value != curInputVal){
        // console.log(input.value);
        repoList = [];
        curInputVal = input.value;
        handleInput(input.value);
    }
}


async function handleInput(name) {
    let li = name.split(' ').join('');
    const nameList = li.split(',');
    reposContainer.innerText = '';
    console.log(nameList);
    for (let i = 0; i < nameList.length; i++){
        const userName = nameList[i];
        const repos = await fetchAPI(userName);
        handleRender(repos);
    }
    console.log(repoList);
    showRepos();
}


/* Get total number of repos */
async function getReposCount(userName) {
    const resp = await fetch('https://api.github.com/users/' + userName);
    if (resp.ok) {
        const data = await resp.json();
        return data.public_repos;
    }
}


async function fetchAPI(userName) {
    const reposCount = await getReposCount(userName);
    let totalRepos = [];

    /* Since only maximum 100 repos per page */
    for (let page = 1;
        page <= Math.ceil(reposCount/100);
        page++) {
	    const resp = await fetch(`https://api.github.com/users/${userName}/repos?page=${page}&per_page=100`);
        if (resp.ok){
            const reposPerPage = await resp.json();
            totalRepos = totalRepos.concat(reposPerPage);
        }
    }
    return totalRepos;
}


async function handleRender(data) {
    if(!("message" in data) && data["message"] != "Not Found") {
        for(let k=0; k<data.length; k++) {
            repoList.push(data[k]);
        }
    }
}


function sortDisplayingRepos() {
    /* Sort displayedRepoList */
    displayedRepoList = repoList;
    if(curSortCriteria == 'stars') {
        displayedRepoList.sort((b, a) => a.stargazers_count - b.stargazers_count);
    }
    else if(curSortCriteria == 'popular') {
        displayedRepoList.sort((b, a) => (a.stargazers_count + a.forks_count + a.watchers_count) - (b.stargazers_count + b.forks_count + b.watchers_count)
        );
    }
    else if(curSortCriteria == 'original') {
        displayedRepoList = [];
        for(let k=0; k<repoList.length; k++) {
            if(repoList[k].fork == false){
                displayedRepoList.push(repoList[k]);
            }
        }
        displayedRepoList.sort((b, a) => (a.stargazers_count + a.forks_count + a.watchers_count) - (b.stargazers_count + b.forks_count + b.watchers_count)
        );
    }
}


function showRepos() {
    sortDisplayingRepos();

    let fragment = new DocumentFragment();
    for(let i=0; i<displayedRepoList.length; i++){

        /* Create repo card */
        let repoItem = document.createElement('div');
        repoItem.classList.add('repo__card');
        
        /* Title of repo card */
        const url = displayedRepoList[i].html_url;
        const title = displayedRepoList[i].full_name;

        let repoTitle = `
            <a href="${url}" target="_blank">
                ${title}
            </a>
        `;
        
        /* Details of repo */
        const starsCount = displayedRepoList[i].stargazers_count;
        const language = (displayedRepoList[i].language == null)?'--':displayedRepoList[i].language;
        const forksCount = displayedRepoList[i].forks_count;

        let repoStargazers = `
            <div>
                <i class="fas fa-star"></i> ${starsCount}
            </div>
        `;
        let repoLanguage = `
            <div>
                <i class="fas fa-code"></i> ${language}
            </div>
        `;
        let repoForks = `
            <div>
                <i class="fas fa-code-branch"></i> ${forksCount}
            </div>
        `;

        let repoDetails = `
            <div class="repo__details">
                ${repoLanguage}
                ${repoStargazers}
                ${repoForks}
            </div>
        `;

        let repoItemLeft = `
            <div>
                ${repoTitle}
                ${repoDetails}
            </div>
        `;

        /* Avatar of repo owner */
        const avatarUrl = displayedRepoList[i].owner.avatar_url;

        let repoAvatar = `
            <img src="${avatarUrl}">
        `;

        /* Delete button */
        let delButton = `
            <button class="del__button">
                <i class="fas fa-times"></i>
            </button>
        `;
    
        repoItem.insertAdjacentHTML('afterBegin', delButton);
        repoItem.insertAdjacentHTML('afterBegin', repoItemLeft);
        repoItem.insertAdjacentHTML('afterBegin', repoAvatar);

        fragment.append(repoItem);
        
    }
    reposContainer.append(fragment);
}