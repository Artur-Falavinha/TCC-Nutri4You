package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.ListaCompras;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ListaComprasRepository extends JpaRepository<ListaCompras, Integer> {

    Optional<ListaCompras> findByPlano_Id(Integer planoId);

    List<ListaCompras> findByPlano_Paciente_IdOrderByDataGeracaoDescIdDesc(Integer pacienteId);
}

