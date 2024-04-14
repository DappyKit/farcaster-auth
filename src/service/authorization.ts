import { loadConfig } from '../config'

loadConfig()

async function start() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // let task
    try {
      // task = await getTaskByStatus(TaskStatus.IDLE)
      //
      // if (task) {
      //   log(`Found task: ${task?.id}`)
      //   await handleTask(task)
      //   log(`Task completed: ${task?.id}!`)
      // }
    } catch (e) {
      // log(`Task failed: ${task?.id}. Error: ${(e as Error).message}`)
      //
      // if (task) {
      //   await setTaskStatus(task.id, TaskStatus.FAILED)
      // }
      // await sleep(300)
    }
  }
}

start().then()
