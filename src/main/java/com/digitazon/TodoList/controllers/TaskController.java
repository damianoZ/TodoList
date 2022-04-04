package com.digitazon.TodoList.controllers;

import com.digitazon.TodoList.entities.Category;
import com.digitazon.TodoList.entities.Task;
import com.digitazon.TodoList.repositories.CategoryRepository;
import com.digitazon.TodoList.repositories.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired // in questo caso sostituisce linea 14-16
    private TaskRepository taskRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    /*public TaskController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }*/

    @GetMapping("/")
    public Iterable<Task> home() {
        Iterable<Task> tasks = taskRepository.findAll(Sort.by(Sort.Direction.ASC,"created"));
        System.out.println(tasks);
        return tasks;
    }

    @GetMapping("/{id}")
    public Task read(@PathVariable int id) {
        return taskRepository.findById(id).orElseThrow();
    }

    @PostMapping("/add")
    public Task create(@RequestBody Task newTask) {
        Task savedTask = taskRepository.save(newTask);
        Category category = categoryRepository.findById(savedTask.getCategory().getId()).orElseThrow();
        savedTask.setCategory(category);
        return savedTask;
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable int id) {
        taskRepository.deleteById(id);
        return "ok";
    }

    @PutMapping("/{id}")
    public Task update(@PathVariable int id, @RequestBody Task newTask) throws Exception {
        Task oldTask = taskRepository.findById(id).orElseThrow();
        if(newTask.isDone()){
            throw new Exception("NN PUOI SALVARE UN TASK GIA FATTO");
        }
        oldTask.setName(newTask.getName());
        return taskRepository.save(oldTask);
    }

    @PutMapping("/{id}/set-done")
    public Task setDone(@PathVariable int id, @RequestBody Task newTask) {
        Task oldTask = taskRepository.findById(id).orElseThrow();
        oldTask.setDone(newTask.isDone());
        return taskRepository.save(oldTask);
    }

    @DeleteMapping("/all")
    public String deleteAll() {
            taskRepository.deleteAll();
        return "ok";
    }
}
