package com.sece.roombook.controller;

import com.sece.roombook.dto.UserDTO;
import com.sece.roombook.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserDTO userDTO) {

        try {

            UserDTO savedUser = userService.register(userDTO);

            Map<String, Object> response = new HashMap<>();

            response.put("message", "Registration successful");
            response.put("id", savedUser.getId());
            response.put("name", savedUser.getName());
            response.put("email", savedUser.getEmail());
            response.put("role", savedUser.getRole());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            Map<String, String> response = new HashMap<>();

            response.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserDTO userDTO) {

        try {

            UserDTO loggedUser = userService.login(
                    userDTO.getEmail(),
                    userDTO.getPassword(),
                    userDTO.getRole()
            );

            Map<String, Object> response = new HashMap<>();

            response.put("message", "Login successful");
            response.put("id", loggedUser.getId());
            response.put("name", loggedUser.getName());
            response.put("email", loggedUser.getEmail());
            response.put("role", loggedUser.getRole());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            Map<String, String> response = new HashMap<>();

            response.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }
}