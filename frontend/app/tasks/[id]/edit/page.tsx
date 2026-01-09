'use client';

import { useParams } from 'next/navigation';
import TaskForm from '../../new/TaskForm';

export default function EditTaskPage() {
  const params = useParams();
  const taskId = parseInt(params.id as string);

  return <TaskForm taskId={taskId} />;
}