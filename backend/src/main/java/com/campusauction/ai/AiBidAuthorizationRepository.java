package com.campusauction.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiBidAuthorizationRepository extends JpaRepository<AiBidAuthorization, Long> {

    Optional<AiBidAuthorization> findByAuthToken(String authToken);
}
