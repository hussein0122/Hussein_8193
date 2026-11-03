package com.hussein.exam.web;
import com.hussein.exam.repo.IntegrityEventRepository;
import com.hussein.exam.service.IntegrityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
@RestController
@Validated
@RequestMapping("/api/attempts/{attemptId}/integrity-events")
public class IntegrityController {
  private final IntegrityService service; private final IntegrityEventRepository events;
  public IntegrityController(IntegrityService service,IntegrityEventRepository events){this.service=service;this.events=events;}
  public record EventRequest(@NotBlank String eventType) {}
  @PostMapping public ResponseEntity<?> register(@PathVariable UUID attemptId,@Valid @RequestBody EventRequest request){
    try{return ResponseEntity.ok(service.register(attemptId,request.eventType()));}
    catch(NoSuchElementException e){return ResponseEntity.notFound().build();}
    catch(IllegalStateException e){return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message",e.getMessage()));}
    catch(IllegalArgumentException e){return ResponseEntity.badRequest().body(Map.of("message",e.getMessage()));}
  }
  @GetMapping public List<?> list(@PathVariable UUID attemptId){return events.findByAttemptIdOrderByOccurredAtAsc(attemptId);}
}
