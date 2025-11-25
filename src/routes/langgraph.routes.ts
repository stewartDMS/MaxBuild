import { Router, Request, Response, NextFunction } from 'express';
import { LangGraphService } from '../services/langgraph.service';

const router = Router();
const langGraphService = new LangGraphService();

/**
 * GET /api/langgraph/assistants/:id
 * Fetch an assistant by ID from LangGraph API
 */
router.get(
  '/assistants/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: { message: 'Assistant ID is required' },
        });
      }

      const assistant = await langGraphService.getAssistant(id);

      res.status(200).json({
        success: true,
        data: assistant,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
