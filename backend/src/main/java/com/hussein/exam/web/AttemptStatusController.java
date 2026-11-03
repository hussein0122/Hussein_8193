package com.hussein.exam.web;
import com.hussein.exam.repo.ExamAttemptRepository;
import java.util.*;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/attempts")
public class AttemptStatusController {
  private final ExamAttemptRepository attempts;
  public AttemptStatusController(ExamAttemptRepository attempts){this.attempts=attempts;}
  @GetMapping("/{id}/status") public Map<String,Object> status(@PathVariable UUID id){
    var a=attempts.findById(id).orElseThrow();
    return Map.of("id",a.getId(),"status",a.getStatus(),"strikes",a.getStrikes(),"lockedAt",a.getLockedAt()==null?"":a.getLockedAt().toString());
  }
}
