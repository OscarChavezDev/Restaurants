package com.tingo.restaurants.infrastructure.security;

import com.tingo.restaurants.infrastructure.persistence.entity.UserEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserJpaRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        UserEntity user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + userId));

        if (!user.isActive() || user.isDeleted()) {
            throw new UsernameNotFoundException("Usuario inactivo o eliminado: " + userId);
        }

        // Los usuarios de Google no tienen contraseña local. La autenticación es
        // por JWT (no se valida la contraseña aquí), pero Spring User no admite
        // password null, así que usamos un placeholder inutilizable.
        String password = user.getPasswordHash() != null ? user.getPasswordHash() : "{noop}__google_oauth__";

        return User.builder()
                .username(user.getId().toString())
                .password(password)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(!user.isActive())
                .build();
    }
}
