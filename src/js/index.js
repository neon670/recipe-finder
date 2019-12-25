import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Like';
import	* as searchView from './views/search';
import	* as recipeView from './views/recipe';
import	* as listView from './views/list';
import	* as likesView from './views/like';
import { elements, renderLoader, clearLoader } from './views/base';

const state = {}



/*
** Search Controller
*/
const onSearch = async () => {
	//get query
	const query = searchView.getInput();
	if(query){
		state.search = new Search(query);

		//clear input
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchResult);
		try{
			//search for recipes
			await state.search.getResults();

			clearLoader();
			//render recipes
			searchView.showResults(state.search.result);

			// console.log(state.search.result);

		}catch(err){
			console.log(err)
		}
	}
	
}

elements.searchForm.addEventListener('submit' , e => {
	e.preventDefault();
	onSearch();
});

elements.searchResultPages.addEventListener('click', e => {
	// console.log(e.target);
	const btn = e.target.closest('.btn-inline')
	if(btn){
		const goToPage = parseInt(btn.dataset.goto, 10);
		searchView.clearResults();
		searchView.showResults(state.search.result, goToPage);
	}
})


/*
** Recipe Controller
*/
const  controlRecipe = async () => {
	const id = window.location.hash.replace('#', '');
	// console.log(id);
	if(id){
		//prepare ui for render
		recipeView.clearRecipe();
        renderLoader(elements.recipe);

        if (state.search) searchView.highlightSelected(id);

		//create recipe object
		state.recipe = new Recipe(id);

		try{
			//get recipe data
			await state.recipe.getRecipe();
			state.recipe.parseIngredients();

			state.recipe.calcTime();
			state.recipe.calcServing();

			//render recipe
			clearLoader();
			recipeView.renderRecipe(
				state.recipe,
				state.likes.isLiked(id)
				);

		}catch(err){
			console.log(err);
		}
		
		

		
	}
};

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));



/**
** List Controller
*/

const controlList = () => {
	if(!state.list) state.list = new List();

	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItem(item);
	});
}
elements.shopping.addEventListener('click', e => {
	const id = e.target.closest('.shopping__item').dataset.itemid;

	if(e.target.matches('shopping__delete, shopping__delete *')){
		state.list.deleteItem(id);

		listView.deleteItem(id);

	}else if(e.target.matches('.shopping__count-value')){
		const val = parseFloat(e.target.value, 10);
		state.list.updateCount(id, val);
	}
});



/**
** Like Controller
*/
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // User has NOT yet liked current recipe
    if (!state.likes.isLiked(currentID)) {

        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        likesView.toggleLikeBtn(true);

        likesView.renderLike(newLike);

    // User HAS liked current recipe
    } else {
        state.likes.deleteLike(currentID);

        likesView.toggleLikeBtn(false);

        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    
    state.likes.readStorage();

    likesView.toggleLikeMenu(state.likes.getNumLikes());

    state.likes.likes.forEach(like => likesView.renderLike(like));
});


//handle recipe button increase/decrease
elements.recipe.addEventListener('click', e => {
	if(e.target.matches('.btn-decrease, .btn-decrease *')){
		if(state.recipe.servings > 1){
			
			state.recipe.updateServings('dec');
			recipeView.updateServingsIng(state.recipe);	
		}	
		
	}else if(e.target.matches('.btn-increase, .btn-increase *')){
		
		state.recipe.updateServings('inc');
		recipeView.updateServingsIng(state.recipe);
	} else if(e.target.matches('.recipe__btn-add, .recipe__btn-add *')){
		controlList();
	}else if(e.target.matches('.recipe__love, .recipe__love *')){
		//like controller
		controlLike();
	}
	// console.log(state.recipe);
});




