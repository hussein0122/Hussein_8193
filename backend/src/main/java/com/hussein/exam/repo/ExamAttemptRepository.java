package com.hussein.exam.repo;
import com.hussein.exam.domain.ExamAttempt;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select a from ExamAttempt a where a.id = :id")
  Optional<ExamAttempt> findByIdForUpdate(@Param("id") UUID id);
}
