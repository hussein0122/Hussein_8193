package com.hussein.exam.service;
import com.hussein.exam.domain.*;
import com.hussein.exam.repo.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class IntegrityService {
  private final ExamAttemptRepository attempts; private final IntegrityEventRepository events;
  public IntegrityService(ExamAttemptRepository attempts, IntegrityEventRepository events){this.attempts=attempts;this.events=events;}
  @Transactional
  public Map<String,Object> register(UUID attemptId,String eventType) {
    if(!Set.of("TAB_HIDDEN","FULLSCREEN_EXIT","WINDOW_BLUR").contains(eventType)) throw new IllegalArgumentException("Unsupported event type");
    ExamAttempt attempt=attempts.findByIdForUpdate(attemptId).orElseThrow(()->new NoSuchElementException("Attempt not found"));
    if(!"IN_PROGRESS".equals(attempt.getStatus())) throw new IllegalStateException("Attempt is locked or closed");
    attempt.registerStrike();
    IntegrityEvent event=events.save(new IntegrityEvent(attemptId,eventType,attempt.getStrikes()));
    attempts.save(attempt);
    return Map.of("eventId",event.getId(),"strikes",attempt.getStrikes(),"status",attempt.getStatus(),"locked","LOCKED".equals(attempt.getStatus()));
  }
}
