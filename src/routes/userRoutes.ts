import { Router } from 'express';
import * as userController from '../controllers/userController';

const router = Router();

router.post('/users/new', (req, res, next) => {
  void userController.createNew(req, res).catch(next);
});

router.post('/users/edit/:userId', (req, res, next) => {
  void userController.editUser(req, res).catch(next);
});

router.get('/users', (req, res, next) => {
  void userController.getByEmail(req, res).catch(next);
});

export { router as userRoutes };
