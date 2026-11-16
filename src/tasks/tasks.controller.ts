import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';
import { ApiErrorDto, TaskListResponseDto, TaskResponseDto } from './dto/task-response.dto';

@ApiTags('Tareas')
@ApiBadRequestResponse({ description: 'Datos inválidos, campos desconocidos, UUID inválido o PATCH vacío.', type: ApiErrorDto })
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una tarea' })
  @ApiCreatedResponse({ description: 'Tarea creada.', type: TaskResponseDto })
  create(@Body() dto: CreateTaskDto) {
    return this.tasks.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tareas', description: 'Filtros combinables y paginación. Orden: createdAt descendente, id ascendente.' })
  @ApiOkResponse({ description: 'Listado paginado. Una página fuera de rango devuelve data vacío.', type: TaskListResponseDto })
  findAll(@Query() query: ListTasksQueryDto) {
    return this.tasks.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una tarea' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Identificador de la tarea.' })
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiNotFoundResponse({ description: 'La tarea no existe.', type: ApiErrorDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar una tarea', description: 'Enviar al menos un campo. null vacía descripción, responsable o fecha; título y estado no admiten null.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Identificador de la tarea.' })
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiNotFoundResponse({ description: 'La tarea no existe.', type: ApiErrorDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Borrar una tarea' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Identificador de la tarea.' })
  @ApiNoContentResponse({ description: 'Tarea eliminada; sin cuerpo de respuesta.' })
  @ApiNotFoundResponse({ description: 'La tarea no existe.', type: ApiErrorDto })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.remove(id);
  }
}
