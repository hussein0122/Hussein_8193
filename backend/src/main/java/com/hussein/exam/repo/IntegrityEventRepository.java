package com.hussein.exam.repo;
import com.hussein.exam.domain.IntegrityEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface IntegrityEventRepository extends JpaRepository<IntegrityEvent, UUID> {
  List<IntegrityEvent> findByAttemptIdOrderByOccurredAtAsc(UUID attemptId);
}
