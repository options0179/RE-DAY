package com.reday.jobs;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "job_catalog_entries")
@Getter
@Setter
@NoArgsConstructor
public class JobCatalogEntry {

  @Id
  private String id;

  private String name;
  private String category;

  @jakarta.persistence.Column(length = 1000)
  private String summary;

  private boolean popular;

  @ElementCollection(fetch = jakarta.persistence.FetchType.EAGER)
  @CollectionTable(name = "job_catalog_entry_aliases", joinColumns = @JoinColumn(name = "job_id"))
  @jakarta.persistence.Column(name = "alias")
  private List<String> aliases = new ArrayList<>();
}
