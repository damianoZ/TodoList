let taskAddButton = document.getElementById("task-add-button");
let tasksList = document.getElementById("tasks-list");
let taskContent = document.getElementById("task-content");
let categorySelect = document.getElementById("categories-list");
const REST_API_ENDPOINT = "http://localhost:8080";
const HTTP_STATUS_SUCCESS = 200;
let taskCounter = document.getElementById("task-counter");
const deleteAllBtn = document.getElementById("delete-all");
let counter = 0;
let counterDone = 0;
let taskDone = document.getElementById("task-done");

//FUNZIONE CHE AGGIORNA LA SELECT DELLE CATEGORIE INTERROGANDO IL SERVER ATTRAVERSO AJAX 
//VERRA INVOCATA SUBITO DOPO IL COMPLETO CARICAMENTO DELLA PAGINA
function updateCategoriesList() {
    //crea oggetto xmlhttprequest per gestire la chiamata al server
    let ajaxRequest = new XMLHttpRequest();
    //gestisco l'onload
    ajaxRequest.onload = function () {
        //mi salvo le categorie tornate dal serve in una variabile di nome categories PARSANDOLO
        let categories = JSON.parse(ajaxRequest.response);
        //cicliamo ogni categoria all'interno dell' array categories
        for (let category of categories) {
            //creiamo un elemento di tipo option
            let newOption = document.createElement("option");
            //settiamo alla option il valore e il testo prendendolo dal nome della categoria
            newOption.value = category.id;
            newOption.innerText = category.name;
            //appendiamo l'option alla select
            categorySelect.appendChild(newOption);
        }
    }
    //imposto metodo e url a cui fare la richiesta (get)
    ajaxRequest.open("GET", REST_API_ENDPOINT + "/categories/");
    //invio la richiesta al server
    ajaxRequest.send();
}

updateCategoriesList()

function createTask(task) {
    let newTaskLine = document.createElement("div");
    newTaskLine.setAttribute("class", "task");
    if (task.category) {
        newTaskLine.classList.add(task.category.color);
    }
    newTaskLine.setAttribute("data-id", task.id); // attributo parametrizzato -> data-*= da informazioni aggiuntive all'elemento
    // CREO SPAN DI TESTO E DATA
    let newText = document.createElement("span");
    newText.innerText = task.name;
    newTaskLine.appendChild(newText);
    let dateSpan = document.createElement("span");
    dateSpan.setAttribute("class", "date");
    let date = new Date(task.created);
    dateSpan.innerText = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
    newTaskLine.appendChild(dateSpan);
    //CHECKED BUTTON
    let checkBox = document.createElement("button");
    checkBox.setAttribute("class", "task-done");
    checkBox.setAttribute("class", "checked")
    checkBox.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
    newTaskLine.appendChild(checkBox);
    //SE LA TASK è FATTA AGGIUNGO CLASSE E SETTO TRUE SUL DB
    if (task.done) {
        newTaskLine.classList.add("task-done");
        checkBox.checked = true;
    }
    //TRESH
    let trash = document.createElement("button");
    trash.setAttribute("class", "bin");
    newTaskLine.appendChild(trash);
    trash.innerHTML = `<i class="fa-solid fa-trash"></i>`;
    //PEN BUTTON
    let pen = document.createElement("button");
    pen.style.visibility = task.done ? "hidden" : "visible";

    pen.setAttribute("class", "pen");
    pen.setAttribute("data-state", "saved");
    pen.innerHTML = `<i class="fa-solid fa-pencil"></i>`;
    newTaskLine.appendChild(pen);
    //AZIONI SU PEN
    pen.addEventListener("click", function () {
        let newInput = document.createElement("input");
        newInput.setAttribute("size", 30);
        newInput.classList.add("task-text");
        newInput.setAttribute("id", "edit-input-" + task.id);
        if (newTaskLine.classList.contains("editing")) {
            let editInput = document.getElementById("edit-input-" + task.id);
            let taskContent = {
                name: editInput.value
            };
            updatedTask(task.id, taskContent, () => {
                newText.innerText = editInput.value;
                task.name = editInput.value;
                editInput.replaceWith(newText);
                pen.innerHTML = `<i class="fa-solid fa-pencil"></i>`;
                newTaskLine.classList.remove("editing");
                checkBox.style.visibility = "visible";
            });

        } else {
            newInput.value = task.name;
            newText.replaceWith(newInput);
            pen.innerHTML = `<i class="fas fa-save"></i>`;
            newTaskLine.classList.add("editing");
            checkBox.style.visibility = "hidden";
            task.name = newText.innerText;
        }
    });
    //EVENTO CHECKED AL CLICK ( CAMBIO CSS E VALORE DONE SU DB)
    checkBox.addEventListener("click", function () {
        task.done = !task.done;
        let taskContent = {
            done: task.done,
            name: task.name
        };
        setDone(task.id, taskContent, () => {
            newTaskLine.classList.toggle("task-done");
            pen.style.visibility = task.done ? "hidden" : "visible";
            taskDone.innerHTML = task.done ? ++counterDone : --counterDone;
        });
    });
    //DELETE TASK SU CLICK DI TRASH
    trash.addEventListener("click", function () {
        deleteTask(task.id, newTaskLine);
    })
    ///////////APPENDO TASKLINE ALLA LISTA
    tasksList.appendChild(newTaskLine);

    if (task.done) {
        counterDone++;
    }
    counter++;
    taskCounter.innerHTML = counter;
    taskDone.innerHTML = counterDone;
}

//AGGIORNO LA LISTA DEI TASK
function updateTasksList() {
    //RECUPERO DATI DAL DB
    let ajaxRequest = new XMLHttpRequest(); // classe che serve per gestire le richieste (load, open send)
    ajaxRequest.onload = function () {
        let tasks = JSON.parse(ajaxRequest.response);
        console.log(tasks);
        for (let task of tasks) {
            createTask(task);
        }
    }
    ajaxRequest.open("GET", REST_API_ENDPOINT + "/tasks/");
    ajaxRequest.send();
}
updateTasksList();
//////////////METODI CRUD/////////////////
//SAVE
function saveTask(taskToSave, successfullCallback) {
    let ajaxRequest = new XMLHttpRequest();
    ajaxRequest.onload = function () {
        if (ajaxRequest.status == HTTP_STATUS_SUCCESS) {
            let savedTask = JSON.parse(ajaxRequest.response);
            createTask(savedTask);
            successfullCallback();
        }
    }
    ajaxRequest.open("POST", REST_API_ENDPOINT + "/tasks/add");
    // dal momento che il server è di di tipo REST-full utilizza il tipo JSON per scambiare informazioni con il front end
    // pertanto il server SPRING si aspetterà dei dati in formato JSON e NON considererà richieste in cui il formato
    // non è specificato nella Header della richiesta stessa
    ajaxRequest.setRequestHeader("content-type", "application/json");
    let body = {
        name: taskToSave.name, //body della post
        category: {
            id: taskToSave.categoryId
        },
        created: new Date()
    };
    ajaxRequest.send(JSON.stringify(body));
}
//DELETE
function deleteTask(taskid, taskElement) {
    let ajaxRequest = new XMLHttpRequest();
    ajaxRequest.onload = () => {
        if (ajaxRequest.response == "ok") {
            if (taskElement.classList.contains("task-done")) {
                counterDone--;
                taskDone.innerHTML = counterDone;
            }
            taskElement.remove();
            counter--;
            taskCounter.innerHTML = counter;
        }
    }
    ajaxRequest.open("DELETE", REST_API_ENDPOINT + "/tasks/" + taskid);
    ajaxRequest.send();
}
//UPDATE
function updatedTask(taskid, taskContent, successfullCallback) {
    let ajaxRequest = new XMLHttpRequest();
    ajaxRequest.onload = () => {
        if (ajaxRequest.status = HTTP_STATUS_SUCCESS) {
            successfullCallback();
        }
    }
    ajaxRequest.open("PUT", REST_API_ENDPOINT + "/tasks/" + taskid);
    ajaxRequest.setRequestHeader("content-type", "application/json");
    ajaxRequest.send(JSON.stringify(taskContent));
}

function setDone(taskid, taskContent, successfullCallback) {
    let ajaxRequest = new XMLHttpRequest();
    ajaxRequest.onload = () => {
        if (ajaxRequest.status = HTTP_STATUS_SUCCESS) {
            successfullCallback();
        }
    }
    ajaxRequest.open("PUT", REST_API_ENDPOINT + "/tasks/" + taskid + "/set-done");
    ajaxRequest.setRequestHeader("content-type", "application/json");
    ajaxRequest.send(JSON.stringify(taskContent));
}

// DELETE ALL
function deleteAll(successfullCallback) {
    let ajaxRequest = new XMLHttpRequest();
    ajaxRequest.onload = () => {
        if (ajaxRequest.response == "ok") {
            successfullCallback();
        }
    }
    ajaxRequest.open("DELETE", REST_API_ENDPOINT + "/tasks/all");
    ajaxRequest.send();
}

deleteAllBtn.addEventListener("click", function(){
    deleteAll(()=>{
        tasksList.innerHTML = "";
        taskDone.innerHTML = counterDone = 0;
        taskCounter.innerHTML = counter = 0;
    })
})



//EVENTO SU BOTTONE +
taskAddButton.addEventListener("click", function () {
    let taskContentValue = taskContent.value;
    if (taskContentValue == "") {
        return;
    }
    let taskCategory = categorySelect.value;
    if (!taskCategory) {
        alert("aggiungi una categoria");
        return;
    }
    //mi creo un oggetto che rappresenta il task da aggiungere
    let task = {
        name: taskContentValue,
        categoryId: taskCategory
    };
    saveTask(task, () => {
        taskContent.value = "";
    });
});

/*

    //PULISCO LA VALUE DEL CONTENT
    taskContent.value = "";

     /CREO input DEL TESTO E LO APPENDO ALLA LINE
        let newText = document.createElement("input");
        newText.classList.add("task-text");
        newText.setAttribute("size", "50");
        newText.setAttribute("disabled", "disabled");
        newText.value = taskContentValue;
        newTaskLine.appendChild(newText);
        tasksList.appendChild(newTaskLine);
        tasksList.setAttribute("class", "list");


    //RIABILITO INPUTO AL TOCCO DI PEN

    //SPIN
    let spin = document.createElement("button");
    spin.setAttribute("class", "spin");
    spin.innerHTML = `<div class="spinner-border text-warning" role="status">
    <span class="sr-only">Loading...</span>
  </div>`;
    newTaskLine.appendChild(spin);
    
    // DISABILITO I BUTTON CHECKED TRASH E PEN
    checked.setAttribute("disabled", "disabled");
    trash.setAttribute("disabled", "disabled");
    pen.setAttribute("disabled", "disabled");

    sendTaskToServer(taskContentValue, newTaskLine, spin, checked, trash, pen);*/

//UPDATE TASK

/*let ajaxRequest = new XMLHttpRequest();
ajaxRequest.onload = () => {
    console.log(ajaxRequest.response);
    if (ajaxRequest.response == "ok") {
        taskHTMLelement.classList.remove("unconfirmed");
    }
};
ajaxRequest.open("post", "https://webhook.site/27e46949-33e5-4e57-9294-3e135372566e");
let body = {
    text: taskContentValue
};
ajaxRequest.send(JSON.stringify(body));*/

//SAVE TASK

/*ajaxRequest.onload = () => {
    console.log(ajaxRequest.response);
    let response = JSON.parse(ajaxRequest.response);
    console.log(response);
    if (response.result == "ok") {
        taskHTMLelement.classList.remove("unconfirmed");
        taskHTMLelement.removeChild(loading);
        //RIABILITO I BUTTON CHECKED TRASH E PEN
        done.removeAttribute("disabled", "disabled");
        remove.removeAttribute("disabled", "disabled");
        edit.removeAttribute("disabled", "disabled");
        taskHTMLelement.setAttribute("data-id", response.inserted_id);
    }
};*/

//SEND FUNCTION
/*function sendTaskToServer(taskContentValue, taskHTMLelement, loading, done, remove, edit) {
    let ajaxRequest = new XMLHttpRequest();
    ajaxRequest.onload = () => {
        console.log(ajaxRequest.response);
        let response = JSON.parse(ajaxRequest.response);
        console.log(response);
        if (response.result == "ok") {
            taskHTMLelement.classList.remove("unconfirmed");
            taskHTMLelement.removeChild(loading);
            //RIABILITO I BUTTON CHECKED TRASH E PEN
            done.removeAttribute("disabled", "disabled");
            remove.removeAttribute("disabled", "disabled");
            edit.removeAttribute("disabled", "disabled");
            taskHTMLelement.setAttribute("data-id", response.inserted_id);
        }
    };
    ajaxRequest.open("post", "https://webhook.site/27e46949-33e5-4e57-9294-3e135372566e");
    let body = {
        text: taskContentValue
    };
    ajaxRequest.send(JSON.stringify(body));
}*/

//UPDATE TASK
