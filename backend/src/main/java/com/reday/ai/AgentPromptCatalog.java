package com.reday.ai;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Port of backend/src/ai/prompt-catalog.ts — loads the extracted Copilot Agent instructions + skill prompts from docs/dev/agent. */
@Component
public class AgentPromptCatalog {

  public record SkillPrompt(String name, String content) {
  }

  public record Prompts(String mainInstructions, List<SkillPrompt> skills) {
  }

  private final Path docsDir;

  public AgentPromptCatalog(@Value("${reday.agent.docs-dir}") String docsDir) {
    this.docsDir = Path.of(docsDir);
  }

  public Prompts load() {
    Path skillsDir = docsDir.resolve("skills");
    if (!Files.isDirectory(skillsDir)) {
      throw new IllegalStateException("Agent prompt directory not found: " + skillsDir);
    }
    try (Stream<Path> files = Files.list(skillsDir)) {
      List<SkillPrompt> skills = files
          .filter(path -> path.getFileName().toString().endsWith(".md"))
          .sorted()
          .map(this::readSkill)
          .toList();
      if (skills.isEmpty()) {
        throw new IllegalStateException("No Agent skill prompts found in " + skillsDir);
      }
      String mainInstructions = Files.readString(docsDir.resolve("main-instructions.md"), StandardCharsets.UTF_8);
      return new Prompts(mainInstructions, skills);
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }

  private SkillPrompt readSkill(Path path) {
    try {
      String fileName = path.getFileName().toString();
      String name = fileName.substring(0, fileName.length() - ".md".length());
      return new SkillPrompt(name, Files.readString(path, StandardCharsets.UTF_8));
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }
}
