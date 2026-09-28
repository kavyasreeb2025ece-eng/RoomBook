package com.sece.roombook.service;

import com.sece.roombook.dto.UserDTO;
import com.sece.roombook.entity.User;
import com.sece.roombook.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // REGISTER
    public UserDTO register(UserDTO userDTO) {

        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        String role = userDTO.getRole();

        if (role == null || role.isBlank()) {
            role = "EMPLOYEE";
        }

        // Allow only valid roles
        if (!role.equalsIgnoreCase("ADMIN")
                && !role.equalsIgnoreCase("MANAGER")
                && !role.equalsIgnoreCase("EMPLOYEE")) {

            throw new RuntimeException("Invalid role");
        }

        User user = new User();

        user.setName(userDTO.getName());
        user.setEmail(userDTO.getEmail());
        user.setPassword(userDTO.getPassword());
        user.setRole(role.toUpperCase());

        User savedUser = userRepository.save(user);

        return convertToDTO(savedUser);
    }

    // LOGIN
    public UserDTO login(String email, String password, String role) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Invalid email or password"));

        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!user.getRole().equalsIgnoreCase(role)) {
            throw new RuntimeException("Incorrect role selected");
        }

        return convertToDTO(user);
    }

    // Convert Entity → DTO
    private UserDTO convertToDTO(User user) {

        UserDTO dto = new UserDTO();

        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());

        return dto;
    }
}