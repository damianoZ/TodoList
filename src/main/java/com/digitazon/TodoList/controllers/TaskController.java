package com.digitazon.TodoList.controllers;

import com.digitazon.TodoList.repositories.TaskRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TaskController {
    private TaskRepository taskRepository;

    public TaskController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @GetMapping("/")
    public String home() {
        long tot = taskRepository.count();
        System.out.println(tot);
        return "Benvenuti!";
    }
}
