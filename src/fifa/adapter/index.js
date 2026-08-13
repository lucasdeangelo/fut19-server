// FIFA19Adapter — orquestra o fluxo:
//
//   FIFA Request → Request Mapper → FUT Service → Response Mapper → FIFA Response
//
// O adapter é agnóstico ao formato de wire: ele recebe um request já
// normalizado (createFifaRequest), encontra o mapeamento, executa o serviço
// interno e entrega o envelope de resposta. Erros de protocolo são lançados
// como ProtocolError.
//
// Extensível: novos mapeamentos entram via `addMapper` ou no array retornado
// por createDefaultRequestMapper().

import { createFifaRequest } from "./request.js";
import { ResponseMapper } from "./response.js";
import { ProtocolError, ERROR_CODES } from "./errors.js";
import { createDefaultRequestMapper } from "./mappers.js";

export class FIFA19Adapter {
  constructor({
    services = {},
    requestMapper,
    responseMapper,
    sessionService = null
  } = {}) {
    this.services = services;
    this.sessionService = sessionService;
    this.requestMapper = requestMapper ?? createDefaultRequestMapper();
    this.responseMapper = responseMapper ?? new ResponseMapper();
  }

  addMapper(mapper) {
    this.requestMapper.push(mapper);
  }

  listMappedRoutes() {
    return this.requestMapper.map((m) => ({
      id: m.id,
      description: m.description
    }));
  }

  async handle(rawRequest) {
    const request = createFifaRequest(rawRequest);

    // TODO (autenticação): validar sessão FIFA quando o mecanismo real de
    // sessão/autenticação do cliente for confirmado. Hoje o adapter não
    // exige sessão nos mapeamentos de desenvolvimento.
    const mapper = this.requestMapper.find((m) => m.match(request));

    if (!mapper) {
      throw new ProtocolError(
        ERROR_CODES.UNMAPPED_ROUTE,
        `Nenhum mapeamento para ${request.method} ${request.path}`,
        404
      );
    }

    const mapped = await mapper.map(request);
    const service = this.services[mapped.serviceName];

    if (!service) {
      throw new ProtocolError(
        ERROR_CODES.UNKNOWN_SERVICE,
        `Serviço interno desconhecido: ${mapped.serviceName}`,
        500
      );
    }

    const method = service[mapped.method];
    if (typeof method !== "function") {
      throw new ProtocolError(
        ERROR_CODES.UNKNOWN_METHOD,
        `Método desconhecido: ${mapped.serviceName}.${mapped.method}`,
        500
      );
    }

    const result = await method.apply(service, mapped.args ?? []);
    return this.responseMapper.wrap(result, request);
  }
}
