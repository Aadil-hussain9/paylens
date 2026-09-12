package com.incubyte.paylens.assistant.web;

import com.incubyte.paylens.assistant.service.AssistantService;
import com.incubyte.paylens.assistant.web.dto.AssistantQueryRequest;
import com.incubyte.paylens.assistant.web.dto.AssistantResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/query")
    public AssistantResponse query(@RequestBody AssistantQueryRequest request) {
        return assistantService.handleQuery(request);
    }
}
